import { useState, useCallback, useEffect } from 'react';
import { notesService } from '../services/notesService';
import { storageService } from '../services/storageService';
import { arrayMove } from '@dnd-kit/sortable';

export const useNotes = (isAuthenticated) => {
    const [notesList, setNotesList] = useState(() => storageService.getNotes() || []);
    const [processingId, setProcessingId] = useState(null);
    const [isServerAwake, setIsServerAwake] = useState(true);
    const [isReady, setIsReady] = useState(false);

    const processNoteResponse = useCallback((rawNote) => {
        // Добавляем проверку: если контент пришел зашифрованный (начинается с Salted__ или похож на AES), 
        // мы не должны давать ему попасть в стейт в чистом виде.
        // Но так как мы договорились, что бэкенд ВСЕГДА шлет текст, просто маппим поля.
        return {
            ...rawNote,
            content: rawNote.content || '', 
            isCollapsed: rawNote.isCollapsed || false,
            isCompleted: rawNote.isCompleted || false,
            updatedAt: rawNote.updatedAt
        };
    }, []);

    const fetchNotes = useCallback(async () => {
        try {
            const response = await notesService.getAll();
            setIsServerAwake(true);

            const processedData = response.data.map(n => processNoteResponse(n));
            setNotesList(processedData);
            storageService.saveNotes(processedData);
            setIsReady(true);
        } catch (error) {
            console.error("Сервер не ответил при загрузке:", error);
            setIsServerAwake(false);
            const currentCached = storageService.getNotes() || [];
            if (currentCached.length > 0) {
                setIsReady(true);
            }
        }
    }, [processNoteResponse]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const currentCached = storageService.getNotes() || [];
        if (currentCached.length > 0) {
            const processed = currentCached.map(note => processNoteResponse(note));
            setNotesList(processed);
            setIsReady(true);
        } else {
            setIsReady(false);
        }
        fetchNotes();
    }, [isAuthenticated, fetchNotes, processNoteResponse]);

    const handleSaveNote = async (text, setNoteText) => {
        if (!text.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticNote = {
            id: tempId,
            content: text, // ТУТ ЧИСТЫЙ ТЕКСТ
            isCollapsed: false,
            isCompleted: false,
            updatedAt: new Date().toISOString()
        };

        const updatedList = [optimisticNote, ...notesList];
        setNotesList(updatedList);
        storageService.saveNotes(updatedList); // Сохраняем чистый текст в кэш
        setNoteText('');
        setProcessingId(tempId);

        try {
            const response = await notesService.create(text);
            setIsServerAwake(true);

            // ВНИМАНИЕ: Если бэкенд на этом этапе пришлет кракозябры в response.data,
            // они перезапишут твой оптимистичный чистый текст в стейте и в КЭШЕ.
            const finalNote = processNoteResponse(response.data);
            
            setNotesList(prev => {
                const newList = prev.map(n => n.id === tempId ? finalNote : n);
                storageService.saveNotes(newList); // Кэшируем результат от сервера
                return newList;
            });
        } catch (error) {
            console.error("Ошибка сохранения:", error);
            setIsServerAwake(false);
            // Если ошибка — удаляем оптимистичную заметку, чтобы не путать юзера
            setNotesList(prev => prev.filter(n => n.id !== tempId));
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpdateNote = useCallback(async (id, newText, newIsCompleted) => {
        setProcessingId(id);

        // Сохраняем старое состояние на случай ошибки
        const previousNotes = [...notesList];

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
            const response = await notesService.update(id, {
                content: newText,
                isCompleted: newIsCompleted
            });

            setIsServerAwake(true);
            const finalNote = processNoteResponse(response.data);

            setNotesList(prev => {
                const newList = prev.map(n => n.id === id ? finalNote : n);
                storageService.saveNotes(newList);
                return newList;
            });
        } catch {
            setIsServerAwake(false);
            // В случае ошибки возвращаем как было
            setNotesList(previousNotes);
            storageService.saveNotes(previousNotes);
        } finally {
            setProcessingId(null);
        }
    }, [notesList, processNoteResponse]);

    const handleToggleCollapse = useCallback(async (id) => {
        const note = notesList.find(n => n.id === id);
        if (!note) return;

        const nextState = !note.isCollapsed;

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
        }
    }, [notesList]);

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
        handleToggleCollapse,
        handleDeleteNote,
        handleDragEnd,
        setNotesList
    };
};