import { useState, useEffect, useRef, useMemo} from 'react';
import s from '../App.module.css';
import debounce from 'lodash.debounce';

function NoteItem({ note, onDelete, onUpdate }) {
    // 1. Используем локальный стейт для мгновенного отображения ввода
    const [text, setText] = useState(note.content);
    const textareaRef = useRef(null);

    // Подстройка высоты под контент
    const autoResize = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    // Ресайзим при первой отрисовке
    useEffect(() => {
        autoResize();
    }, []);
    
    const debouncedSave = useMemo(
    () => debounce((id, newText) => {
        onUpdate(id, newText);
    }, 1000),
    [onUpdate]
);

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText); // Сначала обновляем экран
        autoResize();     // Тянем поле
        debouncedSave(note.id, newText); // Отправляем в очередь на сохранение
    };

    const formattedDate = new Date(note.createdAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={s.noteItem}>
            {/* 3. ЗАМЕНЯЕМ <p> НА <textarea> ДЛЯ РЕДАКТИРОВАНИЯ */}
            <textarea
                ref={textareaRef}
                className={s.inlineTextarea}
                value={text}
                onChange={handleChange}
                spellCheck="false"
                rows="1"
            />

            <div className={s.noteFooter}>
                <span className={s.noteDate}>{formattedDate}</span>
                <button
                    className={s.deleteBtn}
                    onClick={() => onDelete(note.id)}
                    title="Удалить"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export default NoteItem;