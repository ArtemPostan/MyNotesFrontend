import s from '../styles/App.module.css';

function NoteInput({ noteText, setNoteText, handleSaveNote, processingId, userName, handleLogout }) {
    return (
        <header className={s.stickyHeader}>
            <div className={s.header}>
                <h3 style={{ margin: 0, color: '#fff' }}>{userName}</h3>
                <button onClick={handleLogout} className={s.logoutBtn}>Выйти</button>
            </div>
            <div className={s.inputSection}>
                <div className={s.textareaWrapper}>
                    <textarea
                        className={s.textarea}
                        placeholder="Ваша заметка..."
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                    />
                </div>
                <button
                    className={s.button}
                    onClick={handleSaveNote}
                    disabled={processingId === 'new' || !noteText.trim()}
                >
                    {processingId === 'new' ? <div className={s.btnLoader}></div> : 'Сохранить'}
                </button>
            </div>
        </header>
    );
}

export default NoteInput;