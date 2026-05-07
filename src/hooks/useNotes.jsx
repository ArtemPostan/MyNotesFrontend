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

    const fetchNotes = useCallback(async () => {
        try {
            const response = await notesService.getAll();
            setNotesList(response.data);
            storageService.saveNotes(response.data);
            setIsServerAwake(true);
        } catch (error) {
            if (error.response) setIsServerAwake(true);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const cached = storageService.getNotes();
            if (cached) {
                try {
                    // Если у вас заметки шифруются, дешифруем их здесь
                    const decrypted = cached.map(note => ({
                        ...note,
                        content: notesService.decrypt ? notesService.decrypt(note.content) : note.content
                    }));
                    setNotesList(decrypted);
                } catch (e) {
                    console.error("Ошибка дешифровки кэша", e);
                }
            }
            fetchNotes();
        }
    }, [isAuthenticated]);
    // Вспомогательный метод для обработки ответа от сервера
    const processNoteResponse = useCallback((rawNote) => {
        return {
            ...rawNote,
            // Дешифруем контент, используя наш сервис
            content: notesService.decrypt(rawNote.content),
            // Гарантируем, что дата корректно распознается как строка или объект даты
            updatedAt: rawNote.updatedAt
        };
    }, []);

    const handleSaveNote = async (text, setNoteText) => {
        if (!text.trim()) return;
        const tempId = `temp-${Date.now()}`;
        const plainText = text;

        setNotesList(prev => [{ id: tempId, content: plainText, updatedAt: new Date().toISOString() }, ...prev]);
        setNoteText('');

        try {
            const response = await notesService.create(plainText);

            // Используем хелпер
            const finalNote = processNoteResponse(response.data);

            setNotesList(prev => {
                const updated = prev.map(n => n.id === tempId ? finalNote : n);
                storageService.saveNotes(updated);
                return updated;
            });
        } catch (error) {
            setNotesList(prev => prev.filter(n => n.id !== tempId));
            setNoteText(plainText);
        }
    };

    const handleUpdateNote = useCallback(async (id, updateData) => {
        setProcessingId(id);
        try {
            const payload = typeof updateData === 'string'
                ? { content: updateData }
                : updateData;

            const response = await notesService.update(id, updateData);

            // Используем хелпер
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

        setNotesList(newNotes); // Оптимистичное обновление

        try {
            await notesService.delete(id);
        } catch (error) {
            console.error("Ошибка при удалении:", error);
            // Откат в случае ошибки
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