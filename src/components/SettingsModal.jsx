import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import s from '../styles/SettingsModal.module.css';

// Добавляем новые пропсы: isCompleted и onToggleTodo
const SettingsModal = ({ show, onClose, isCompleted, onToggleTodo }) => {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show]);

    if (!show) return null;

    return ReactDOM.createPortal(
        <div className={s.overlay} onClick={onClose}>           
            <div className={s.modal} onClick={e => e.stopPropagation()}>
                <h4>Функции заметки</h4>
                <div className={s.iconsRow}>
                    {/* 
                      Кнопка "Галочка":
                      1. Добавляем активный класс, если режим включен
                      2. Вешаем onToggleTodo на клик
                    */}
                    <button 
                        className={`${s.iconBtn} ${isCompleted ? s.activeIcon : ''}`} 
                        title={isCompleted ? "Выключить список" : "Сделать списком"}
                        onClick={() => {
                            onToggleTodo(); // Вызываем переключение
                            onClose();      // Закрываем модалку (по желанию)
                        }}
                    >
                        ✅
                    </button>
                    
                    <button className={s.iconBtn} title="Напомнить">⏰</button>
                </div>
                <button className={s.closeBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;