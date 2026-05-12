import React from 'react';
import s from '../styles/App.module.css';

function NoteInput({ 
    noteText, 
    setNoteText, 
    handleSaveNote, 
    processingId, 
    userName, 
    isGuest, 
    handleLogout,
    disabled // Добавляем новый пропс
}) {
    // Состояние "загрузки" или "блокировки"
    const isPending = processingId === 'new';
    const isLocked = disabled || isPending;

    return (
        <header className={s.stickyHeader}>
            <div className={s.header}>
                <h3 style={{ margin: 0, color: '#fff' }}>
                    {userName} {isGuest && <small style={{ opacity: 0.5 }}>(Гость)</small>}
                </h3>
                <button onClick={handleLogout} className={s.logoutBtn}>Выйти</button>
            </div>
            
            <div className={s.inputSection}>
                <textarea
                    className={s.textarea}
                    /* Если сервер спит, меняем плейсхолдер */
                    placeholder={disabled ? "Ожидание сервера..." : "Ваша заметка..."}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    disabled={isLocked} // Блокируем ввод
                    style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
                <button
                    className={s.button}
                    onClick={handleSaveNote}
                    /* Кнопка неактивна, если: идет сохранение, текст пустой ИЛИ сервер спит */
                    disabled={isLocked || !noteText.trim()}
                    style={disabled ? { filter: 'grayscale(1)', opacity: 0.7 } : {}}
                >
                    {isPending ? (
                        <div className={s.btnLoader}></div>
                    ) : disabled ? (
                        'Спит...'
                    ) : (
                        'Сохранить'
                    )}
                </button>
            </div>
            
            {/* Небольшая подсказка для пользователя, если сервер спит */}
            {disabled && (
                <div style={{ 
                    fontSize: '11px', 
                    color: '#ffa500', 
                    textAlign: 'center', 
                    marginTop: '5px',
                    animate: 'pulse 2s infinite' 
                }}>
                    Соединение устанавливается...
                </div>
            )}
        </header>
    );
}

export default NoteInput;