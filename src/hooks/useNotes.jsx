import { useState, useCallback, useEffect } from 'react';
import { notesService } from '../services/notesService';
import { storageService } from '../services/storageService';
import { arrayMove } from '@dnd-kit/sortable';

export const useNotes = (isAuthenticated) => {
    // 1. Инициализируем стейт из хранилища (ленивая инициализация)
    const [notesList, setNotesList] = useState(() => storageService.getNotes() || []);

    const [processingId, setProcessingId] = useState(null);
    const [isServerAwake, setIsServerAwake] = useState(true);
    const [isReady, setIsReady] = useState(false);

    // Функция дешифровки и маппинга полей
    const processNoteResponse = useCallback((rawNote) => {
        return {
            ...rawNote,
            content: notesService.decrypt(rawNote.content),
            isCollapsed: rawNote.isCollapsed || false, // Новое поле
            isCompleted: rawNote.isCompleted || false,
            updatedAt: rawNote.updatedAt
        };
    }, []);

    // Загрузка данных с сервера
    const fetchNotes = useCallback(async () => {
        try {
            const response = await notesService.getAll();
            setIsServerAwake(true);

            const decryptedData = response.data.map(n => processNoteResponse(n));
            setNotesList(decryptedData);
            storageService.saveNotes(decryptedData);
            setIsReady(true);
        } catch (error) {
            console.error("Сервер не ответил при загрузке:", error);
            setIsServerAwake(false);

            // Если сервер спит, проверяем локальный кэш
            const currentCached = storageService.getNotes() || [];
            if (currentCached.length > 0) {
                setIsReady(true);
            }
        }
    }, [processNoteResponse]);

    // Логика при монтировании и изменении авторизации
    useEffect(() => {
        if (!isAuthenticated) return;

        const encryptionKey = localStorage.getItem('encryption_key');
        const currentCached = storageService.getNotes() || [];

        if (encryptionKey && currentCached.length > 0) {
            try {
                const decrypted = currentCached.map(note => processNoteResponse(note));
                setNotesList(decrypted);
                setIsReady(true);
            } catch (e) {
                console.error("Ошибка дешифровки кэша:", e);
            }
        } else if (currentCached.length === 0) {
            setIsReady(false);
        }

        fetchNotes();
    }, [isAuthenticated, fetchNotes, processNoteResponse]);

    // --- ОБРАБОТЧИКИ СОБЫТИЙ --- 

    // Создание заметки
    const handleSaveNote = async (text, setNoteText) => {
        if (!text.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticNote = {
            id: tempId,
            content: text,
            isCollapsed: false,
            updatedAt: new Date().toISOString()
        };

        const updatedList = [optimisticNote, ...notesList];
        setNotesList(updatedList);
        storageService.saveNotes(updatedList);
        setNoteText('');
        setProcessingId(tempId);

        try {
            const response = await notesService.create(text);
            setIsServerAwake(true);

            const finalNote = processNoteResponse(response.data);
            setNotesList(prev => {
                const newList = prev.map(n => n.id === tempId ? finalNote : n);
                storageService.saveNotes(newList);
                return newList;
            });
        } catch (error) {
            console.error("Ошибка сохранения:", error);
            setIsServerAwake(false);
        } finally {
            setProcessingId(null);
        }
    };

    // Обновление контента (текста)
    // Исправленная функция в useNotes.js
    const handleUpdateNote = useCallback(async (id, newText, newIsCompleted) => {
        setProcessingId(id);

        // 1. Оптимистично обновляем локальный стейт (чтобы плашка появилась МГНОВЕННО)
        setNotesList(prev => {
            const updated = prev.map(n =>
                n.id === id
                    ? { ...n, content: newText, isCompleted: newIsCompleted ?? n.isCompleted }
                    : n
            );
            storageService.saveNotes(updated);
            return updated;
        });

        try {
            // 2. Отправляем на сервер ВСЕ поля
            // Убедись, что notesService.update принимает объект с нужными полями
            const response = await notesService.update(id, {
                content: newText,
                isCompleted: newIsCompleted
            });

            setIsServerAwake(true);
            const finalNote = processNoteResponse(response.data);

            setNotesList(prev => prev.map(n => n.id === id ? finalNote : n));
        } catch {
            setIsServerAwake(false);
        } finally {
            setProcessingId(null);
        }
    }, [processNoteResponse]);

    // Сворачивание/Разворачивание заметки
    const handleToggleCollapse = useCallback(async (id) => {
        const note = notesList.find(n => n.id === id);
        if (!note) return;

        const nextState = !note.isCollapsed;

        // Оптимистичное обновление
        setNotesList(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, isCollapsed: nextState } : n);
            storageService.saveNotes(updated);
            return updated;
        });

        try {
            await notesService.update(id, { isCollapsed: nextState });
            setIsServerAwake(true);
        } catch {
            setIsServerAwake(false);
            console.error("Ошибка синхронизации сворачивания");
        }
    }, [notesList]);

    // Удаление заметки
    const handleDeleteNote = async (id) => {
        if (!window.confirm("Удалить заметку?")) return;

        const backupList = [...notesList];
        const filteredList = notesList.filter(n => n.id !== id);

        setNotesList(filteredList);
        storageService.saveNotes(filteredList);
        setProcessingId(id);

        try {
            await notesService.delete(id);
            setIsServerAwake(true);
        } catch {
            setIsServerAwake(false);
            setNotesList(backupList);
            storageService.saveNotes(backupList);
            alert("Сервер спит. Удаление временно невозможно.");
        } finally {
            setProcessingId(null);
        }
    };

    // Drag & Drop перемещение
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = notesList.findIndex((n) => n.id === active.id);
            const newIndex = notesList.findIndex((n) => n.id === over.id);
            const newList = arrayMove(notesList, oldIndex, newIndex);

            setNotesList(newList);
            storageService.saveNotes(newList);

            try {
                await notesService.reorder(newList.map(n => n.id));
                setIsServerAwake(true);
            } catch {
                setIsServerAwake(false);
            }
        }
    };

    return {
        notesList,
        isReady,
        processingId,
        isServerAwake,
        handleSaveNote,
        handleUpdateNote,
        handleToggleCollapse, // Новое
        handleDeleteNote,
        handleDragEnd,
        setNotesList
    };
};