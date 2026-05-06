import React, { memo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import s from './NoteItem.module.css';

const NoteItem = memo(({ note, onDelete, onUpdate, isUpdating }) => {
    // Локальный текст, который видит пользователь при печати
    const [text, setText] = useState(note.content);
    
    // Проверяем, отличается ли текущий текст от того, что в базе
    const isDirty = text !== note.content;

    const textareaRef = useRef(null);

    // DnD логика
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = 
        useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Синхронизация: если заметка обновилась извне
    useEffect(() => {
        setText(note.content);
    }, [note.content]);

    // Авто-высота
    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text]);

    const handleSave = () => {
        if (isDirty && !isUpdating) {
            onUpdate(note.id, text);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={s.noteItem}>
            {/* Ручка для перетаскивания */}
            <div className={s.dragHandle} {...attributes} {...listeners}>⠿</div>
            
            <textarea
                ref={textareaRef}
                className={s.inlineTextarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck="false"
            />

            <div className={s.noteFooter}>
                <div className={s.statusArea}>
                    {isUpdating ? (
                        <div className={s.miniLoader} />
                    ) : (
                        isDirty && (
                            <button 
                                className={s.saveBtn} 
                                onClick={handleSave}
                                title="Сохранить изменения"
                            >
                                Сохранить
                            </button>
                        )
                    )}
                </div>
                
                <div className={s.actions}>
                    <button className={s.deleteBtn} onClick={() => onDelete(note.id)}>
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
});

export default NoteItem;