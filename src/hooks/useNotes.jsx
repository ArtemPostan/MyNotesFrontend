import { useState, useCallback, useEffect } from 'react';
import { notesService } from '../services/notesService';
import { storageService } from '../services/storageService';
import { syncQueueService } from '../services/syncQueueService';
import { arrayMove } from '@dnd-kit/sortable';
import useServerSync from './useServerSync';

export const useNotes = (isAuthenticated) => {
    const [notesList, setNotesList] = useState(() => storageService.getNotes() || []);
    const [processingId, setProcessingId] = useState(null);
    const [isReady, setIsReady] = useState(false);

    // Подключаем наш продвинутый синхронизатор
    const { isServerAwake, isSyncing, executeSync, addToQueue, processQueue } = useServerSync();

    const processNoteResponse = useCallback((rawNote) => {
        return {
            ...rawNote,
            content: rawNote.content || '',
            isCollapsed: rawNote.isCollapsed || false,
            isCompleted: rawNote.isCompleted || false,
            updatedAt: rawNote.updatedAt
        };
    }, []);

    // Загрузка данных
    // Загрузка данных (УМНЫЙ МЕРЖ СЕРВЕРА И ЛОКАЛЬНЫХ ТЕМП-ЗАМЕТОК)
    const fetchNotes = useCallback(async () => {
        const currentCached = storageService.getNotes() || [];
        if (currentCached.length > 0) {
            setNotesList(currentCached.map(n => processNoteResponse(n)));
            setIsReady(true);
        }

        try {
            await executeSync(
                () => notesService.getAll(),
                (serverData) => {
                    const processedServerData = serverData.map(n => processNoteResponse(n));

                    setNotesList(prev => {
                        // 1. Находим в текущем UI все заметки, которые были созданы в офлайне (у них ID начинается с 'temp-')
                        const pendingNotes = prev.filter(n => String(n.id).startsWith('temp-'));

                        // 2. Объединяем: берем актуальные заметки с сервера + докидываем сверху те, что еще не улетели
                        const mergedList = [...pendingNotes, ...processedServerData];

                        // Исключаем возможные дубликаты по ID (на случай гонки условий)
                        const uniqueList = Array.from(new Map(mergedList.map(item => [item.id, item])).values());

                        storageService.saveNotes(uniqueList);
                        return uniqueList;
                    });
                }
            );
        } catch {
            console.error("Офлайн режим при старте, работаем на кэше");
        } finally {
            setIsReady(true);
        }
    }, [executeSync, processNoteResponse]);

    // Общая функция обработки очереди, обернутая в useCallback
    const handleSyncQueue = useCallback(() => {
        processQueue(notesService, (tempId, serverNote) => {
            // Коллбэк: когда сервер успешно создал заметку из офлайна,
            // меняем её временный ID на реальный в стейте и локальном кэше
            const finalNote = processNoteResponse(serverNote);
            setNotesList(prev => {
                const newList = prev.map(n => n.id === tempId ? finalNote : n);
                storageService.saveNotes(newList);
                return newList;
            });
        });
    }, [processQueue, processNoteResponse]);

    // Инициализация и сброс при смене флага авторизации
    useEffect(() => {
        if (!isAuthenticated) {
            // КОГДА ПОЛЬЗОВАТЕЛЬ ВЫХОДИТ: полностью очищаем стейты хука и офлайн-очередь, 
            // чтобы при следующем входе всё инициализировалось с чистого листа
            setNotesList([]);
            setIsReady(false);
            setProcessingId(null);
            syncQueueService.clearQueue();
            return;
        }

        // КОГДА ПОЛЬЗОВАТЕЛЬ ВХОДИТ: запускаем загрузку и обрабатываем накопившуюся очередь
        fetchNotes();
        handleSyncQueue();
    }, [isAuthenticated, fetchNotes, handleSyncQueue]);


    // --- ДЕЙСТВИЕ: СОЗДАНИЕ ЗАМЕТКИ ---
    const handleSaveNote = async (text, setNoteText) => {
        if (!text.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticNote = {
            id: tempId,
            content: text,
            isCollapsed: false,
            isCompleted: false,
            updatedAt: new Date().toISOString()
        };

        const updatedList = [optimisticNote, ...notesList];
        setNotesList(updatedList);
        storageService.saveNotes(updatedList);
        setNoteText('');

        if (!isServerAwake) {
            addToQueue('CREATE', tempId, { content: text });
            return;
        }

        setProcessingId(tempId);

        try {
            await executeSync(
                () => notesService.create(text),
                (serverNote) => {
                    const finalNote = processNoteResponse(serverNote);
                    setNotesList(prev => {
                        const newList = prev.map(n => n.id === tempId ? finalNote : n);
                        storageService.saveNotes(newList);
                        return newList;
                    });
                }
            );
        } finally {
            setProcessingId(null);
        }
    };

    // --- ДЕЙСТВИЕ: РЕДАКТИРОВАНИЕ / ВЫПОЛНЕНИЕ ---
    const handleUpdateNote = useCallback(async (id, newText, newIsCompleted) => {
        setNotesList(prev => {
            const updated = prev.map(n =>
                n.id === id ? { ...n, content: newText, isCompleted: newIsCompleted ?? n.isCompleted } : n
            );
            storageService.saveNotes(updated);
            return updated;
        });

        if (!isServerAwake) {
            addToQueue('UPDATE', id, { content: newText, isCompleted: newIsCompleted });
            return;
        }

        setProcessingId(id);

        try {
            await executeSync(
                () => notesService.update(id, { content: newText, isCompleted: newIsCompleted })
            );
        } finally {
            setProcessingId(null);
        }
    }, [isServerAwake, addToQueue, executeSync]);

    // --- ДЕЙСТВИЕ: УДАЛЕНИЕ ЗАМЕТКИ ---
    const handleDeleteNote = async (id) => {
        if (!window.confirm("Удалить заметку?")) return;

        const filteredList = notesList.filter(n => n.id !== id);
        setNotesList(filteredList);
        storageService.saveNotes(filteredList);

        if (!isServerAwake) {
            addToQueue('DELETE', id, null);
            return;
        }

        setProcessingId(id);

        try {
            await executeSync(() => notesService.delete(id));
        } finally {
            setProcessingId(null);
        }
    };

    // --- ДЕЙСТВИЕ: ПЕРЕТАСКИВАНИЕ ---
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = notesList.findIndex((n) => n.id === active.id);
            const newIndex = notesList.findIndex((n) => n.id === over.id);
            const newList = arrayMove(notesList, oldIndex, newIndex);

            setNotesList(newList);
            storageService.saveNotes(newList);

            await executeSync(
                () => notesService.reorder(newList.map(n => n.id)),
                null,
                null,
                () => {
                    // Офлайн: порядок сохранен локально в кэше
                }
            );
        }
    };

    return {
        notesList,
        isReady,
        processingId,
        isServerAwake,
        isSyncing,
        processQueue: handleSyncQueue, // Экспортируем настроенную функцию для вызова из App.jsx
        handleSaveNote,
        handleUpdateNote,
        handleDeleteNote,
        handleDragEnd,
        setNotesList
    };
};