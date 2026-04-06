import { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { notesService } from './services/notesService';
import s from './App.module.css'; // Импортируем стили как объект s
import NoteItem from './components/NoteItem';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [notesList, setNotesList] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchNotes();
        }
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await notesService.getAll();
            setNotesList(res.data);
        } catch (error) {
            console.error("Ошибка загрузки:", error);
        }
    };

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        setLoadingNotes(true);
        try {
            await notesService.create(noteText);
            setNoteText('');
            fetchNotes();
        } catch (error) {
            alert("Не удалось сохранить: " + error);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            setMessage("Загрузка...");
            if (isLogin) {
                const res = await authService.login(email, password);
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                    setIsAuthenticated(true);
                    setMessage("");
                    fetchNotes();
                }
            } else {
                await authService.register({ email, password, name });
                setIsLogin(true);
                setMessage('Регистрация успешна! Теперь войдите.');
            }
        } catch (err) {
            setMessage("Ошибка: " + (err.response?.data?.message || "Ошибка сервера"));
        }
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setNotesList([]);
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm("Удалить эту заметку?")) return;

        try {
            await notesService.delete(id);
            // Просто фильтруем список в стейте, чтобы не делать лишний запрос fetchNotes()
            setNotesList(notesList.filter(note => note.id !== id));
        } catch (error) {
            alert("Не удалось удалить: " + error);
        }
    };

    return (
        <div className={s.container}>
            <h1 style={{ textAlign: 'center' }}>MyNotes 📝</h1>

            {!isAuthenticated ? (
                <div className={s.card}>
                    <h3>{isLogin ? 'Вход' : 'Регистрация'}</h3>
                    <form onSubmit={handleAuth}>
                        {!isLogin && (
                            <input className={s.input} type="text" placeholder="Ваше имя"
                                value={name} onChange={e => setName(e.target.value)} required />
                        )}
                        <input className={s.input} type="email" placeholder="Email"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                        <input className={s.input} type="password" placeholder="Пароль"
                            value={password} onChange={e => setPassword(e.target.value)} required />

                        {/* Здесь оставляем инлайновый style только для динамического цвета */}
                        <button
                            className={s.button}
                            style={{ backgroundColor: isLogin ? '#007bff' : '#28a745' }}
                            type="submit"
                        >
                            {isLogin ? 'Войти' : 'Создать аккаунт'}
                        </button>
                    </form>
                    <button className={s.linkBtn} onClick={() => { setIsLogin(!isLogin); setMessage(""); }}>
                        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                    </button>
                    {message && (
                        <div
                            className={s.message}
                            style={{ backgroundColor: message.includes('Ошибка') ? '#f8d7da' : '#e8f5e9' }}
                        >
                            {message}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className={s.header}>
                        <h3>Мои заметки</h3>
                        <button onClick={handleLogout} className={s.logoutBtn}>Выйти</button>
                    </div>

                    <div className={s.inputSection}>
                        <textarea
                            className={s.textarea}
                            placeholder="Введите текст..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                        />
                        <button
                            className={s.button}
                            onClick={handleSaveNote}
                            disabled={loadingNotes}
                        >
                            {loadingNotes ? 'Сохранение...' : 'Сохранить заметку'}
                        </button>
                    </div>

                    <div className={s.listSection}>
                        {notesList.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666' }}>Заметок пока нет.</p>
                        ) : (
                            notesList.slice().reverse().map(note => (
                                <NoteItem key={note.id} note={note} onDelete={handleDeleteNote} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;