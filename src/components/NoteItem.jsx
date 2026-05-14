import { useState, useEffect, useRef, useCallback } from 'react';
// Импорт разделенных стилей
import base from '../styles/NoteItem/BaseNote.module.css';
import editor from '../styles/NoteItem/NoteEditor.module.css';
import controls from '../styles/NoteItem/NoteControls.module.css';

import SettingsModal from './SettingsModal';
import NoteChecklist from './NoteChecklist';
import debounce from 'lodash.debounce';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function NoteItem({ note, onDelete, onUpdate, onToggleCollapse, isUpdating }) {
    const [text, setText] = useState(note.content);
    const textareaRef = useRef(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Функционал dnd-kit
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: note.id, disabled: isSettingsOpen });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isSettingsOpen ? 5000 : (isDragging ? 100 : 1),
        opacity: isDragging ? 0.6 : 1,
    };

    const autoResize = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea && !note.isCollapsed) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, [note.isCollapsed]);

    useEffect(() => {
        autoResize();
    }, [text, autoResize]);

    const debouncedUpdate = useRef(
        debounce((id, newText) => {
            onUpdate(id, newText);
        }, 1500)
    ).current;

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        if (newText !== note.content) {
            debouncedUpdate(note.id, newText);
        }
    };

    // Логика форматирования даты
    const isEdited = note.updatedAt && note.updatedAt !== note.createdAt;
    const displayDate = isEdited ? note.updatedAt : note.createdAt;
    const label = isEdited ? "Обновлено " : "";

    const formatDate = (dateData) => {
        if (!dateData) return "Дата неизвестна";
        try {
            let d;
            if (Array.isArray(dateData)) {
                d = new Date(dateData[0], dateData[1] - 1, dateData[2], dateData[3] || 0, dateData[4] || 0);
            } else {
                d = new Date(dateData);
            }
            return d.toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return "Ошибка даты"; }
    };

    const formattedDate = formatDate(displayDate);

    // Заглушка для расшифровки
    if (note.content && note.content.startsWith('U2FsdGVkX1')) {
        return (
            <div className={base.noteItem} style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div className={controls.miniLoader}></div>
            </div>
        );
    }

    const lines = text.split('\n');

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${base.noteItem} ${isSettingsOpen ? base.activeNote : ''} ${note.isCollapsed ? base.collapsed : ''}`}
        >
            {/* 1. Handle для перетаскивания */}
            <div
                className={base.dragHandle}
                {...attributes}
                {...listeners}
                title="Зажмите, чтобы переместить"
            >
                <span className={base.dragIcon}>⠿</span>
            </div>

            {/* 2. Поле контента (использует стили editor) */}
            <div className={editor.container}>
                <textarea
                    ref={textareaRef}
                    className={`${editor.textarea} ${note.isCollapsed ? editor.collapsed : ''}`}
                    value={text}
                    onChange={handleChange}
                    spellCheck="false"
                    rows="1"
                    readOnly={note.isCollapsed}
                />

                <NoteChecklist
                    lines={lines}                   
                    isVisible={note.isCompleted === true && !note.isCollapsed}
                />
            </div>

            {/* 3. Футер заметки */}
            <div className={base.noteFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        className={controls.collapseBtn}
                        onClick={() => onToggleCollapse(note.id)}
                        title={note.isCollapsed ? "Развернуть" : "Свернуть"}
                    >
                        {note.isCollapsed ? '▼' : '▲'}
                    </button>

                    <span className={base.noteDate}>
                        {label}{formattedDate}
                    </span>
                    {isUpdating && <div className={controls.miniLoader}></div>}
                </div>

                <div className={base.footerActions}>
                    <button
                        className={controls.deleteBtn}
                        onClick={() => onDelete(note.id)}
                        disabled={isUpdating}
                    >
                        ✕
                    </button>
                    <button
                        className={controls.settingsBtn}
                        onClick={() => setIsSettingsOpen(true)}
                        title="Настройки"
                    >
                        ⚙️
                    </button>
                </div>

                <SettingsModal
                    show={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    isCompleted={note.isCompleted}
                    onToggleTodo={() => onUpdate(note.id, text, !note.isCompleted)}
                />
            </div>
        </div>
    );
}

export default NoteItem;