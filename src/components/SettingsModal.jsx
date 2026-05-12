import React from 'react';
import s from '../styles/SettingsModal.module.css';

const SettingsModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className={s.overlay} onClick={onClose}>
            <div className={s.modal} onClick={e => e.stopPropagation()}>
                <h4>Функции заметки</h4>
                <div className={s.iconsRow}>
                    {/* Кликабельные иконки без функционала (пока) */}
                    <button className={s.iconBtn} title="Выполнено">
                        ✅
                    </button>
                    <button className={s.iconBtn} title="Напомнить">
                        ⏰
                    </button>
                </div>
                <button className={s.closeBtn} onClick={onClose}>Закрыть</button>
            </div>
        </div>
    );
};

export default SettingsModal;