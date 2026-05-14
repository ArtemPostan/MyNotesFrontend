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
    const inputRefs = useRef([]); // Массив ссылок для строк списка
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

    // Функция ресайза для ОДИНОЧНОЙ textarea (обычный режим)
    const autoResizeMain = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea && !note.isCollapsed) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, [note.isCollapsed]);

    // Функция ресайза для ВСЕХ textarea в режиме списка
    const autoResizeAllLines = useCallback(() => {
        inputRefs.current.forEach(el => {
            if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
            }
        });
    }, []);

    // Следим за изменениями текста и режима
    useEffect(() => {
        if (!note.isCompleted) {
            autoResizeMain();
        } else {
            autoResizeAllLines();
        }
    }, [text, note.isCompleted, note.isCollapsed, autoResizeMain, autoResizeAllLines]);

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

    // Логика управления списком (Enter / Backspace)
    const handleKeyDown = (e, index) => {
        const lines = text.split('\n');

        if (e.key === 'Enter') {
            e.preventDefault();
            const newLines = [...lines];
            newLines.splice(index + 1, 0, ""); 
            const newText = newLines.join('\n');
            
            setText(newText);
            handleChange({ target: { value: newText } });

            setTimeout(() => {
                if (inputRefs.current[index + 1]) {
                    inputRefs.current[index + 1].focus();
                }
            }, 0);
        }

        if (e.key === 'Backspace' && lines[index] === "" && lines.length > 1) {
            e.preventDefault();
            const newLines = lines.filter((_, i) => i !== index);
            const newText = newLines.join('\n');
            
            setText(newText);
            handleChange({ target: { value: newText } });

            setTimeout(() => {
                const prevInput = inputRefs.current[index - 1];
                if (prevInput) {
                    prevInput.focus();
                    const len = prevInput.value.length;
                    prevInput.setSelectionRange(len, len);
                }
            }, 0);
        }
    };

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
            <div
                className={base.dragHandle}
                {...attributes}
                {...listeners}
                title="Зажмите, чтобы переместить"
            >
                <span className={base.dragIcon}>⠿</span>
            </div>

            <div className={editor.container}>
                {!note.isCompleted ? (
                    <textarea
                        ref={textareaRef}
                        className={`${editor.textarea} ${note.isCollapsed ? editor.collapsed : ''}`}
                        value={text}
                        onChange={handleChange}
                        spellCheck="false"
                        rows="1"
                        readOnly={note.isCollapsed}
                    />
                ) : (
                    <div style={{ width: '100%' }}>
                        {lines.map((line, index) => (
                            <div key={index} className={editor.todoRow}>
                                <div className={editor.checkboxCell}>
                                    <input type="checkbox" className={editor.realCheckbox} />
                                </div>
                                <textarea
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    className={editor.textarea}
                                    value={line}
                                    rows="1"
                                    spellCheck="false"
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onChange={(e) => {
                                        const newLines = [...lines];
                                        newLines[index] = e.target.value;
                                        handleChange({ target: { value: newLines.join('\n') } });
                                    }}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    style={{ overflow: 'hidden', resize: 'none' }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

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