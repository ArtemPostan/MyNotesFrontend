import { useState, useEffect, useRef, useMemo } from 'react';
import s from '../App.module.css';
import debounce from 'lodash.debounce';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function NoteItem({ note, onDelete, onUpdate, isUpdating }) {
    const [text, setText] = useState(note.content);
    const [prevContent, setPrevContent] = useState(note.content);
    const textareaRef = useRef(null);

    // Подключаем функционал сортировки dnd-kit
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: note.id });

    // Стили для плавного перемещения
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.6 : 1,
    };

    // Синхронизируем стейт текста при обновлении пропсов
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

    useEffect(() => {
        autoResize();
    }, [text]);

    const debouncedSave = useMemo(
        () => debounce((id, newText) => {
            onUpdate(id, newText);
        }, 1000),
        [onUpdate]
    );

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        debouncedSave(note.id, newText);
    };

    // Логика форматирования даты
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
        <div 
            ref={setNodeRef} // Реф для библиотеки DnD
            style={style} 
            className={s.noteItem}
        >
            {/* 1. Область для перетаскивания (Handle) */}
            <div 
                className={s.dragHandle} 
                {...attributes} 
                {...listeners}
                title="Зажмите, чтобы переместить"
            >
                <span className={s.dragIcon}>⠿</span>
            </div>

            {/* 2. Поле контента */}
            <textarea
                ref={textareaRef}
                className={s.inlineTextarea}
                value={text}
                onChange={handleChange}
                spellCheck="false"
                rows="1"
            />

            {/* 3. Футер заметки */}
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