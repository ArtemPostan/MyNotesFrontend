import s from '../App.module.css';

function NoteItem({ note, onDelete }) {
    return (
        <div className={s.noteItem}>
            <p style={{ margin: '0 0 10px 0', paddingRight: '30px' }}>{note.content}</p>
            <small style={{ color: '#888' }}>
                {new Date(note.createdAt).toLocaleString('ru-RU')}
            </small>
            <button
                className={s.deleteBtn}
                onClick={() => onDelete(note.id)}
                title="Удалить"
            >
                ✕
            </button>
        </div>
    );
}

export default NoteItem;