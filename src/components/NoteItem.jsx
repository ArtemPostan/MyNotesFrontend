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
    } = useSortable({ id: note.id, disabled: isSettingsOpen });

    // Стили для плавного перемещения
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isSettingsOpen ? 5000 : (isDragging ? 100 : 1),
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

    const formatDate = (dateData) => {
        if (!dateData) return "Дата неизвестна";

        try {
            let d;
            if (Array.isArray(dateData)) {
                // Исправляем типичную проблему Java/Spring: [2026, 5, 12, 10, 30]
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
        // Если текст начинается с сигнатуры AES (зашифрован), показываем лоадер
        return (
            <div className={s.noteItem} style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div className={s.btnLoader}></div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef} // Реф для библиотеки DnD
            style={style}
            className={`${s.noteItem} ${isSettingsOpen ? s.activeNote : ''}`}
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