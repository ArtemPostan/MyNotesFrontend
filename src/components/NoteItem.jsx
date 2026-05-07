import React, { memo, useState, useRef, useLayoutEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SettingsModal from './SettingsModal';
import s from './NoteItem.module.css';

const NoteItem = memo(({ note, onDelete, onUpdate, isUpdating }) => {
    // 1. Инициализируем локальный текст
    const [localText, setLocalText] = useState(note.content);
    // 2. Добавляем "предыдущий" текст для отслеживания изменений пропса
    const [prevContent, setPrevContent] = useState(note.content);

    const textareaRef = useRef(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // ПАТТЕРН: Синхронизация пропса и стейта без useEffect
    // Если note.content изменился извне (база обновилась), подтягиваем его в localText
    if (note.content !== prevContent) {
        setLocalText(note.content);
        setPrevContent(note.content);
    }

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = 
        useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative'
    };

    // Авто-высота остается в useLayoutEffect (это правильно для DOM-манипуляций)
    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [localText]);

    const isDirty = localText !== note.content;

    const handleSave = () => {
        if (isDirty && !isUpdating) {
            onUpdate(note.id, localText);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={s.noteItem}>
            <div className={s.dragHandle} {...attributes} {...listeners}>
                <span className={s.dragIcon}>⠿</span>
            </div>
            
            <textarea
                ref={textareaRef}
                className={`${s.inlineTextarea} ${note.isCompleted ? s.textStrike : ''}`}
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                spellCheck="false"
                disabled={note.isCompleted}
                placeholder="Текст заметки..."
            />

            <div className={s.noteFooter}>
                <div className={s.statusArea}>
                    {isUpdating ? (
                        <div className={s.miniLoader} />
                    ) : (
                        isDirty && (
                            <button className={s.saveBtn} onClick={handleSave} type="button">
                                Сохранить
                            </button>
                        )
                    )}
                </div>
                
                <div className={s.controls}>
                    <button 
                        className={s.settingsBtn} 
                        onClick={() => setIsSettingsOpen(true)}
                        type="button"
                    >
                        ⚙️
                    </button>
                    <button 
                        className={s.deleteBtn} 
                        onClick={() => onDelete(note.id)}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <SettingsModal
                show={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                note={note}
                onUpdate={onUpdate}
            />
        </div>
    );
});

export default NoteItem;