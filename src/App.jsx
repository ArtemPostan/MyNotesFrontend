// src/App.jsx
import { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { notesService } from './services/notesService';
import s from './App.module.css';
import NoteItem from './components/NoteItem';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [userName, setUserName] = useState(''); // Состояние для имени пользователя
    const [message, setMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [notesList, setNotesList] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedName = localStorage.getItem('userName'); // Проверяем имя в памяти
        if (token) {
            setIsAuthenticated(true);
            setUserName(savedName || 'Пользователь');
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
            const errorData = error.response?.data;
            const errorText = typeof errorData === 'string' ? errorData : "Не удалось сохранить";
            alert("Ошибка: " + errorText);
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

                    // Если бэкенд возвращает имя (например, в поле name или user.name)
                    const displayName = res.data.name || email.split('@')[0];
                    localStorage.setItem('userName', displayName);

                    setUserName(displayName);
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
            // --- ВОТ ТУТ ОБРАБОТКА ---
            const errorData = err.response?.data;

            // Если это строка (наш ResponseStatusException), берем её.
            // Если это объект (стандартный JSON), берем .message
            const errorText = typeof errorData === 'string'
                ? errorData
                : (errorData?.message || "Ошибка сервера");

            setMessage("Ошибка: " + errorText);
        }
    };

    const handleLogout = () => {
        authService.logout();
        localStorage.removeItem('userName'); // Очищаем имя
        setIsAuthenticated(false);
        setUserName('');
        setNotesList([]);
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm("Удалить эту заметку?")) return;
        try {
            await notesService.delete(id);
            setNotesList(notesList.filter(note => note.id !== id));
        } catch (error) {
            const errorData = error.response?.data;
            const msg = typeof errorData === 'string'
                ? errorData
                : (errorData?.message || error.message);
            alert("Ошибка при удалении: " + msg);
        }
    };

    const handleUpdateNote = async (id, newContent) => {
        try {
            await notesService.update(id, newContent);
            // Обновляем только локальный стейт, чтобы не перезагружать весь список
            setNotesList(prev => prev.map(n => n.id === id ? { ...n, content: newContent } : n));
        } catch (error) {
            console.error("Ошибка автосохранения:", error);
        }
    };

    return (
        <div className={s.container}>
            <header style={{ padding: '20px 0' }}>
                <h1 style={{ textAlign: 'center', margin: 0, color: '#fff' }}>MyNotes 📝</h1>
            </header>

            {!isAuthenticated ? (
                <div className={s.card}>
                    <h3 style={{ marginTop: 0, textAlign: 'center', color: '#fff' }}>
                        {isLogin ? 'Вход' : 'Регистрация'}
                    </h3>
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!isLogin && (
                            <input
                                className={s.input}
                                type="text"
                                placeholder="Ваше имя"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        )}
                        <input
                            className={s.input}
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className={s.input}
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        <button
                            className={s.button}
                            style={{ backgroundColor: isLogin ? '#007bff' : '#28a745', marginTop: '10px' }}
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
                            style={{
                                backgroundColor: message.includes('Ошибка') ? 'rgba(248, 215, 218, 0.1)' : 'rgba(232, 245, 233, 0.1)',
                                color: message.includes('Ошибка') ? '#ff4d4f' : '#28a745',
                                border: `1px solid ${message.includes('Ошибка') ? '#ff4d4f' : '#28a745'}`
                            }}
                        >
                            {message}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <header className={s.stickyHeader}>
                        <div className={s.header}>
                            {/* ТЕПЕРЬ ТУТ ИМЯ ПОЛЬЗОВАТЕЛЯ */}
                            <h3 style={{ margin: 0, color: '#fff' }}>
                                {userName}
                            </h3>
                            <button onClick={handleLogout} className={s.logoutBtn}>Выйти</button>
                        </div>

                        <div className={s.inputSection}>
                            <textarea
                                className={s.textarea}
                                placeholder="Ваша заметка..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            />
                            <button
                                className={s.button}
                                onClick={handleSaveNote}
                                disabled={loadingNotes}
                            >
                                {loadingNotes ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </header>

                    <main className={s.listSection}>
                        {notesList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '60px' }}>
                                <span style={{ fontSize: '40px' }}>Empty</span>
                                <p>У вас пока нет ни одной заметки</p>
                            </div>
                        ) : (
                            notesList.map(note => (
                                <NoteItem
                                    key={note.id}
                                    note={note}
                                    onDelete={handleDeleteNote}
                                    onUpdate={handleUpdateNote}
                                />
                            ))
                        )}
                    </main>
                </>
            )}
        </div>
    );
}

export default App;