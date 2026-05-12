import { useState, useEffect, useRef, useCallback } from 'react';
import s from '../styles/NoteItem.module.css';
import SettingsModal from './SettingsModal';
import debounce from 'lodash.debounce';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Добавляем onToggleCollapse в пропсы
function NoteItem({ note, onDelete, onUpdate, onToggleCollapse, isUpdating }) {
    const [text, setText] = useState(note.content);
    const textareaRef = useRef(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Подключаем функционал сортировки dnd-kit
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: note.id, disabled: isSettingsOpen });

    // Стили для плавного перемещения
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
    }, [note.isCollapsed]) // Пересчитываем при изменении текста или статуса сворачивания

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

        // Сравниваем с исходным контентом из пропсов
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
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Ошибка даты";
        }
    };

    const formattedDate = formatDate(displayDate);

    if (note.content && note.content.startsWith('U2FsdGVkX1')) {
        return (
            <div className={s.noteItem} style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div className={s.btnLoader}></div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${s.noteItem} ${isSettingsOpen ? s.activeNote : ''} ${note.isCollapsed ? s.collapsed : ''}`}
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

            {/* 2. Поле контента (скрывается через CSS или условие, если свернуто) */}
            <div className={s.textareaContainer}>
                <textarea
                    ref={textareaRef}
                    className={`${s.inlineTextarea} ${note.isCollapsed ? s.hiddenTextarea : ''}`}
                    value={text}
                    onChange={handleChange}
                    spellCheck="false"
                    rows="1"
                    readOnly={note.isCollapsed} // Запрещаем ввод в свернутом виде
                />
            </div>

            {/* 3. Футер заметки */}
            <div className={s.noteFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Кнопка Свернуть/Развернуть */}
                    <button
                        className={s.collapseBtn}
                        onClick={() => onToggleCollapse(note.id)}
                        title={note.isCollapsed ? "Развернуть" : "Свернуть"}
                    >
                        {note.isCollapsed ? '▼' : '▲'}
                    </button>

                    <span className={s.noteDate}>
                        {label}{formattedDate}
                    </span>
                    {isUpdating && <div className={s.miniLoader}></div>}
                </div>

                <div className={s.footerActions}>
                    <button
                        className={s.deleteBtn}
                        onClick={() => onDelete(note.id)}
                        disabled={isUpdating}
                    >
                        ✕
                    </button>
                    <button
                        className={s.settingsBtn}
                        onClick={() => setIsSettingsOpen(true)}
                        title="Настройки"
                    >
                        ⚙️
                    </button>
                </div>

                <SettingsModal
                    show={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            </div>
        </div>
    );
}

export default NoteItem;