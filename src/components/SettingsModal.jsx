import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import s from '../styles/SettingsModal.module.css';

const SettingsModal = ({ show, onClose }) => {
    // 1. Сначала вызываем все хуки (обязательно до любых return)
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        // Сброс при размонтировании компонента
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show]);

    // 2. И только потом делаем ранний возврат для отрисовки
    if (!show) return null;

    return ReactDOM.createPortal(
        <div className={s.overlay} onClick={onClose}>
            <div className={s.modal} onClick={e => e.stopPropagation()}>
                <h4>Функции заметки</h4>
                <div className={s.iconsRow}>
                    <button className={s.iconBtn} title="Выполнено">
                        ✅
                    </button>
                    <button className={s.iconBtn} title="Напомнить">
                        ⏰
                    </button>
                </div>
                <button className={s.closeBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;