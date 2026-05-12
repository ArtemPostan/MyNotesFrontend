import { useState, useEffect, useRef } from 'react';
import s from '../styles/NoteItem.module.css';
import SettingsModal from './SettingsModal';
import debounce from 'lodash.debounce';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function NoteItem({ note, onDelete, onUpdate, isUpdating }) {
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
    } = useSortable({ id: note.id });

    // Стили для плавного перемещения
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.6 : 1,
    };

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

    const formatDate = (dateValue) => {
        if (!dateValue) return "";

        // Просто создаем объект даты. 
        // Если в строке есть 'Z' или '+00:00', браузер сам сконвертирует время в местное.
        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
            // Если пришел массив (на случай, если аннотация не сработала)
            if (Array.isArray(dateValue)) {
                const [year, month, day, hour, minute, second = 0] = dateValue;
                return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
                    .toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
            }
            return "Дата не указана";
        }

        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                <button
                    className={s.settingsBtn}
                    onClick={() => setIsSettingsOpen(true)}
                    title="Настройки"
                >
                    ⚙️
                </button>
                <SettingsModal
                    show={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            </div>
        </div>
    );
}

export default NoteItem;