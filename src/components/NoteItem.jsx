import React, { useState, useRef, useLayoutEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SettingsModal from './SettingsModal';
import s from './NoteItem.module.css';

const NoteItem = ({ note, onDelete, onUpdate, isUpdating, setEditingNote }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: note.id });

    // 1. Инициализация стейта
    const [text, setText] = useState(note.content);
    const [prevContent, setPrevContent] = useState(note.content);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const textareaRef = useRef(null);

    // 2. СИНХРОНИЗАЦИЯ ВО ВРЕМЯ РЕНДЕРА (Вместо useEffect)
    // Как только note.content в пропсах изменится (расшифруется), 
    // мы обновляем локальный стейт прямо здесь. 
    // React перерендерит компонент мгновенно, не дожидаясь отрисовки старых данных.
    if (note.content !== prevContent) {
        setPrevContent(note.content);
        setText(note.content);
    }

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative'
    };

    // 3. АВТО-ВЫСОТА
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    // Используем useLayoutEffect только для манипуляций с DOM (высотой)
    useLayoutEffect(() => {
        adjustHeight();
    }, [text]); // Высота пересчитается всякий раз, когда меняется текст

    const handleChange = (e) => {
        const val = e.target.value;
        setText(val);
        setEditingNote({ id: note.id, content: val });
    };

    const formattedDate = note.updatedAt
        ? new Date(note.updatedAt).toLocaleString([], { 
            hour: '2-digit', minute: '2-digit', 
            day: '2-digit', month: '2-digit' 
          })
        : '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${s.noteItem} ${note.isCompleted ? s.completed : ''}`}
        >
            <div
                className={s.dragHandle}
                {...attributes}
                {...listeners}
                title="Зажмите, чтобы переместить"
            >
                <span className={s.dragIcon}>⠿</span>
            </div>

            <textarea
                ref={textareaRef}
                className={`${s.inlineTextarea} ${note.isCompleted ? s.textStrike : ''}`}
                value={text}
                onChange={handleChange}
                spellCheck="false"
                disabled={note.isCompleted}
                placeholder="Текст заметки..."
            />

            <div className={s.noteFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={s.noteDate}>{formattedDate}</span>
                    {isUpdating && <div className={s.miniLoader}></div>}
                </div>

                <div className={s.controls}>
                    <button className={s.settingsBtn} onClick={() => setIsSettingsOpen(true)}>⚙️</button>
                    <button 
                        className={s.deleteBtn} 
                        onClick={() => onDelete(note.id)} 
                        disabled={isUpdating}
                    >✕</button>
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
};

export default NoteItem;