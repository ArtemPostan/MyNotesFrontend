import { useState, useEffect, useRef, useMemo } from 'react';
import s from '../App.module.css';
import debounce from 'lodash.debounce';

function NoteItem({ note, onDelete, onUpdate, isUpdating }) {
    const [text, setText] = useState(note.content);
    const [prevContent, setPrevContent] = useState(note.content);
    const textareaRef = useRef(null);

    // 1. Синхронизируем стейт текста БЕЗ обращения к рефам
    if (note.content !== prevContent) {
        setPrevContent(note.content);
        if (!isUpdating) {
            setText(note.content);
        }
    }

    const autoResize = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    // 2. Используем useEffect ТОЛЬКО для подстройки высоты
    // Это не вызовет ошибку "cascading renders", так как мы не меняем стейт, 
    // а только манипулируем DOM (стилями) после того, как React закончил отрисовку.
    useEffect(() => {
        autoResize();
    }, [text]); // Каждый раз, когда текст меняется (включая ввод и загрузку с сервера)

    const debouncedSave = useMemo(
        () => debounce((id, newText) => {
            onUpdate(id, newText);
        }, 1000),
        [onUpdate]
    );

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText); 
        // Здесь autoResize сработает через useEffect выше
        debouncedSave(note.id, newText); 
    };

    const isEdited = note.updatedAt && note.updatedAt !== note.createdAt;
    const displayDate = isEdited ? note.updatedAt : note.createdAt;
    const label = isEdited ? "Обновлено " : "";

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        if (Array.isArray(dateValue)) {
            const [year, month, day, hour, minute] = dateValue;
            return new Date(year, month - 1, day, hour, minute).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? "Дата не указана" : date.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formattedDate = formatDate(displayDate);

    return (
        <div className={s.noteItem}>
            <textarea
                ref={textareaRef}
                className={s.inlineTextarea}
                value={text}
                onChange={handleChange}
                spellCheck="false"
                rows="1"
            />

            <div className={s.noteFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={s.noteDate}>
                        {label}{formattedDate}
                    </span>
                    {isUpdating && <div className={s.miniLoader}></div>}
                </div>

                <button 
                    className={s.deleteBtn} 
                    onClick={() => onDelete(note.id)}
                    disabled={isUpdating}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export default NoteItem;