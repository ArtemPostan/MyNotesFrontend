import { useState, useCallback, useEffect } from 'react';
import { notesService } from '../services/notesService';
import { storageService } from '../services/storageService';
import { arrayMove } from '@dnd-kit/sortable';

export const useNotes = (isAuthenticated) => {
    const cachedNotes = storageService.getNotes() || [];
    const [notesList, setNotesList] = useState(cachedNotes);
    const [isConnecting, setIsConnecting] = useState(cachedNotes.length === 0);
    const [processingId, setProcessingId] = useState(null);
    const [isServerAwake, setIsServerAwake] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const processNoteResponse = useCallback((rawNote) => {
        return {
            ...rawNote,
            content: notesService.decrypt(rawNote.content),
            updatedAt: rawNote.updatedAt
        };
    }, []);

    // 1. Улучшенная функция загрузки с проверкой пробуждения
    const fetchNotes = useCallback(async (retryCount = 0) => {
        try {
            const response = await notesService.getAll();
            
            // Если запрос прошел успешно, значит сервер проснулся
            setIsServerAwake(true);
            
            // Мапим данные (дешифровка)
            const decryptedData = response.data.map(n => processNoteResponse(n));
            
            setNotesList(decryptedData);
            storageService.saveNotes(decryptedData);
            
            // Только здесь помечаем, что всё готово
            setIsReady(true);
        } catch (error) {
            console.error("Ошибка загрузки заметок:", error);
            
            // Если сервер не отвечает (503 или таймаут) и это первая попытка
            if (retryCount < 1) {
                console.log("Сервер спит, пробую еще раз через 3 секунды...");
                setTimeout(() => fetchNotes(retryCount + 1), 3000);
            } else {
                // Если совсем всё плохо, работаем с кэшем, если он есть
                if (cachedNotes.length > 0) {
                    setIsReady(true);
                }
                setIsConnecting(false);
            }
        } finally {
            setIsConnecting(false);
        }
    }, [processNoteResponse, cachedNotes.length]);

    useEffect(() => {
        if (isAuthenticated) {
            const encryptionKey = localStorage.getItem('encryption_key');

            // 2. Логика проверки ключа и кэша
            if (!encryptionKey) {
                const cached = storageService.getNotes();
                if (!cached || cached.length === 0) {
                    setIsReady(true);
                    setIsConnecting(false);
                } else {
                    setIsReady(false); // Ждем ключа для старого юзера
                }
            } else {
                // Если ключ есть, пробуем расшифровать кэш сразу для мгновенного показа
                const cached = storageService.getNotes();
                if (cached && cached.length > 0) {
                    try {
                        const decrypted = cached.map(note => processNoteResponse(note));
                        setNotesList(decrypted);
                        setIsReady(true);
                    } catch {
                        console.error("Кэш зашифрован другим ключом");
                    }
                }
            }
            fetchNotes();
        }
    }, [isAuthenticated, fetchNotes, processNoteResponse]);

    // 3. Исправленный обработчик сохранения (Retry логика)
    const handleSaveNote = async (text, setNoteText) => {
        if (!text.trim()) return;
        
        const tempId = `temp-${Date.now()}`;
        const optimisticNote = { 
            id: tempId, 
            content: text, 
            updatedAt: new Date().toISOString() 
        };

        setNotesList(prev => [optimisticNote, ...prev]);
        setNoteText('');
        setProcessingId('new');

        try {
            const response = await notesService.create(text);
            const finalNote = processNoteResponse(response.data);
            
            setNotesList(prev => {
                const updated = prev.map(n => n.id === tempId ? finalNote : n);
                storageService.saveNotes(updated);
                return updated;
            });
            setIsServerAwake(true);
        } catch (error) {
            console.error("Ошибка сохранения:", error);
            // Если ошибка из-за того, что сервер "уснул" в процессе
            setNotesList(prev => prev.filter(n => n.id !== tempId));
            setNoteText(text); // Возвращаем текст в поле ввода
            alert("Сервер не ответил. Попробуйте еще раз через мгновение.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpdateNote = useCallback(async (id, updateData) => {
        setProcessingId(id);
        try {
            const response = await notesService.update(id, updateData);
            const finalNote = processNoteResponse(response.data);
            setNotesList(prev => {
                const newList = prev.map(n => n.id === id ? finalNote : n);
                storageService.saveNotes(newList);
                return newList;
            });
        } catch (err) {
            console.error("Ошибка обновления:", err);
        } finally {
            setProcessingId(null);
        }
    }, [processNoteResponse]);

    const handleDeleteNote = async (id) => {
        if (!window.confirm("Вы уверены?")) return;
        const index = notesList.findIndex(n => n.id === id);
        if (index === -1) return;

        const noteToDelete = notesList[index];
        const newNotes = notesList.filter(n => n.id !== id);
        setNotesList(newNotes);

        try {
            await notesService.delete(id);
            storageService.saveNotes(newNotes);
        } catch {
            setNotesList(prev => {
                const restored = [...prev];
                restored.splice(index, 0, noteToDelete);
                return restored;
            });
        }
    };

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
            } catch {
                console.error("Ошибка сохранения порядка");
            }
        }
    };
    

    return {
        notesList,
        isReady,
        isConnecting,
        processingId,
        isServerAwake,
        handleSaveNote,
        handleUpdateNote,
        handleDeleteNote,
        handleDragEnd,
        setNotesList
    };
};