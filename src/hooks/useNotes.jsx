import { useState, useCallback, useEffect } from 'react';
import { notesService } from '../services/notesService';
import { storageService } from '../services/storageService';
import { arrayMove } from '@dnd-kit/sortable';

export const useNotes = (isAuthenticated) => {
    // 1. Инициализация состояний
    const cachedNotes = storageService.getNotes() || [];
    const [notesList, setNotesList] = useState(cachedNotes);
    const [isConnecting, setIsConnecting] = useState(cachedNotes.length === 0);
    const [processingId, setProcessingId] = useState(null);
    const [isServerAwake, setIsServerAwake] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Вспомогательный метод для дешифровки и обработки
    const processNoteResponse = useCallback((rawNote) => {
        return {
            ...rawNote,
            content: notesService.decrypt(rawNote.content),
            updatedAt: rawNote.updatedAt
        };
    }, []);

    // Функция загрузки данных
    const fetchNotes = useCallback(async () => {
        try {
            const response = await notesService.getAll();
            // Данные дешифруются внутри сервиса getAll
            setNotesList(response.data);
            storageService.saveNotes(response.data);
            setIsServerAwake(true);
            setIsReady(true);
        } catch (error) {
            if (error.response) setIsServerAwake(true);
            // Если есть кэш, мы всё равно помечаем систему как готовую
            setIsReady(true);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Логика при загрузке и изменении статуса авторизации
    useEffect(() => {
        if (isAuthenticated) {
            const encryptionKey = localStorage.getItem('encryption_key');

            if (!encryptionKey) {
                const cached = storageService.getNotes();
                if (!cached || cached.length === 0) {
                    setIsReady(true);
                    setIsConnecting(false);
                } else {
                    // Если кэш есть, а ключа нет — тогда ждем (это старый юзер)
                    setIsReady(false);
                }
            }

            const cached = storageService.getNotes();
            if (cached && cached.length > 0) {
                try {
                    const decrypted = cached.map(note => ({
                        ...note,
                        content: notesService.decrypt(note.content)
                    }));
                    setNotesList(decrypted);
                    setIsReady(true);
                } catch (e) {
                    console.error("Ошибка дешифровки кэша", e);
                }
            }
            fetchNotes();
        }
    }, [isAuthenticated, fetchNotes]);

    // Обработчики действий
    const handleSaveNote = async (text, setNoteText) => {
        if (!text.trim()) return;
        const tempId = `temp-${Date.now()}`;
        setNotesList(prev => [{ id: tempId, content: text, updatedAt: new Date().toISOString() }, ...prev]);
        setNoteText('');

        try {
            const response = await notesService.create(text);
            const finalNote = processNoteResponse(response.data);
            setNotesList(prev => {
                const updated = prev.map(n => n.id === tempId ? finalNote : n);
                storageService.saveNotes(updated);
                return updated;
            });
        } catch (error) {
            setNotesList(prev => prev.filter(n => n.id !== tempId));
            setNoteText(text);
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
        } catch (error) {
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