import { useState, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';

export const useNoteEditor = (note, onUpdate) => {


    // Ссылки на элементы для управления фокусом и высотой
    const inputRefs = useRef([]);
    const textareaRef = useRef(null);
    const [prevContent, setPrevContent] = useState(note.content);
    const [localText, setLocalText] = useState(note.content);

    if (note.content !== prevContent) {
        setPrevContent(note.content);
        setLocalText(note.content);
    }

    // Дебаунс для сохранения: вызываем твой handleUpdateNote из useNotes через 1.5 сек
    const debouncedSave = useRef(
        debounce((id, text, isCompleted) => {
            onUpdate(id, text, isCompleted);
        }, 1500)
    ).current;

    // Общий обработчик изменения текста
    const handleTextChange = useCallback((newText) => {
        setLocalText(newText);
        debouncedSave(note.id, newText, note.isCompleted);
    }, [note.id, note.isCompleted, debouncedSave]);

    // Логика переключения чекбокса [x] <=> [ ]
    const toggleTodoLine = useCallback((index) => {
        const lines = localText.split('\n');
        let line = lines[index];

        if (line.startsWith('[x] ')) {
            lines[index] = line.replace('[x] ', '[ ] ');
        } else if (line.startsWith('[ ] ')) {
            lines[index] = line.replace('[ ] ', '[x] ');
        } else {
            // Если маркера не было, добавляем выполненный
            lines[index] = '[x] ' + line;
        }

        const newText = lines.join('\n');
        setLocalText(newText);
        // При клике на чекбокс сохраняем сразу без дебаунса
        onUpdate(note.id, newText, note.isCompleted);
    }, [localText, note.id, note.isCompleted, onUpdate]);

    // Обработка Enter и Backspace
    const handleKeyDown = (e, index) => {
        const lines = localText.split('\n');
        const currentLine = lines[index];

        if (e.key === 'Enter') {
            e.preventDefault();
            const newLines = [...lines];
            // После любой строки (включая заголовок) создаем строку с чекбоксом
            const prefix = note.isCompleted ? "[ ] " : "";
            newLines.splice(index + 1, 0, prefix);

            const joinedText = newLines.join('\n');
            setLocalText(joinedText);
            debouncedSave(note.id, joinedText, note.isCompleted);

            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 0);
        }

        if (e.key === 'Backspace') {
            const isFirstLine = index === 0;
            const isEmpty = currentLine === "" || currentLine === "[ ] " || currentLine === "[x] ";

            // 1. Если это НЕ первая строка и она пустая (только префикс или пусто)
            if (!isFirstLine && isEmpty) {
                e.preventDefault();
                const newLines = lines.filter((_, i) => i !== index);
                const joinedText = newLines.join('\n');

                setLocalText(joinedText);
                debouncedSave(note.id, joinedText, note.isCompleted);

                // Фокус на предыдущую строку
                setTimeout(() => {
                    const prevInput = inputRefs.current[index - 1];
                    if (prevInput) {
                        prevInput.focus();
                        // Ставим курсор в конец текста предыдущей строки
                        const len = prevInput.value.length;
                        prevInput.setSelectionRange(len, len);
                    }
                }, 0);
            }

            // 2. Если мы на первой строке и она пустая - ничего не делаем или удаляем заметку (по желанию)
            // Но префикс у заголовка мы и так не рендерим в NoteContent, поэтому тут проблем быть не должно.
        }
    };
    // Функция для авто-ресайза (можно вызывать из компонентов)
    const adjustHeight = useCallback((el) => {
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }, []);

    return {
        localText,
        setLocalText,
        handleTextChange,
        handleKeyDown,
        toggleTodoLine,
        inputRefs,
        textareaRef,
        adjustHeight
    };
};