import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import s from '../styles/SettingsModal.module.css';

const SettingsModal = ({ show, onClose }) => {
    useEffect(() => {
        // Оставляем блокировку скролла, чтобы окно не "уезжало" при прокрутке фона
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [show]);

    if (!show) return null;

    return ReactDOM.createPortal(
        /* Клик по overlay закроет модалку */
        <div className={s.overlay} onClick={onClose}>           
            <div className={s.modal} onClick={e => e.stopPropagation()}>
                <h4>Функции заметки</h4>
                <div className={s.iconsRow}>
                    <button className={s.iconBtn} title="Выполнено">✅</button>
                    <button className={s.iconBtn} title="Напомнить">⏰</button>
                </div>
                <button className={s.closeBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>,
        document.body
    );
};

export default SettingsModal;