import s from '../App.module.css';

function NoteItem({ note, onDelete }) {
    const formattedDate = new Date(note.createdAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={s.noteItem}>
            <p className={s.noteContent}>{note.content}</p>
            
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