import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://bbac22ncehpq498kutp5.containers.yandexcloud.net";

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

    // Проверяем токен при загрузке страницы
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchNotes();
        }
    }, []);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'X-Auth-Token': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    const fetchNotes = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/notes`, getHeaders());
            setNotesList(response.data);
        } catch (error) {
            console.error("Ошибка при загрузке заметок:", error);
        }
    };

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        setLoadingNotes(true);
        try {
            await axios.post(`${API_URL}/api/notes`, { content: noteText }, getHeaders());
            setNoteText('');
            await fetchNotes();
        } catch (error) {
            alert("Не удалось сохранить заметку: " + error);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin ? { email, password } : { email, password, name };

        try {
            setMessage("Загрузка...");
            const res = await axios.post(`${API_URL}${endpoint}`, payload);

            if (isLogin) {
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                    setIsAuthenticated(true);
                    setMessage(""); 
                    fetchNotes();
                }
            } else {
                setIsLogin(true);
                setMessage('Регистрация успешна! Теперь войдите.');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Ошибка сервера";
            setMessage("Ошибка: " + errorMsg);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setNotesList([]);
        setMessage("");
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', color: '#333' }}>
            <h1 style={{ textAlign: 'center' }}>MyNotes 📝</h1>

            {!isAuthenticated ? (
                <div style={styles.card}>
                    <h3 style={{ color: '#333' }}>{isLogin ? 'Вход' : 'Регистрация'}</h3>
                    <form onSubmit={handleAuth}>
                        {!isLogin && (
                            <input style={styles.input} type="text" placeholder="Ваше имя"
                                value={name} onChange={e => setName(e.target.value)} required />
                        )}
                        <input style={styles.input} type="email" placeholder="Email"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                        <input style={styles.input} type="password" placeholder="Пароль"
                            value={password} onChange={e => setPassword(e.target.value)} required />

                        <button style={{ ...styles.button, backgroundColor: isLogin ? '#007bff' : '#28a745' }} type="submit">
                            {isLogin ? 'Войти' : 'Создать аккаунт'}
                        </button>
                    </form>
                    <button style={styles.linkBtn} onClick={() => { setIsLogin(!isLogin); setMessage(""); }}>
                        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                    </button>
                    {message && (
                        <div style={{ 
                            ...styles.message, 
                            backgroundColor: message.includes('Ошибка') ? '#f8d7da' : '#e8f5e9',
                            color: message.includes('Ошибка') ? '#721c24' : '#155724'
                        }}>
                            {message}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Мои заметки</h3>
                        <button onClick={handleLogout} style={styles.logoutBtn}>Выйти</button>
                    </div>

                    <div style={styles.inputSection}>
                        <textarea
                            style={styles.textarea}
                            placeholder="Введите текст заметки..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                        />
                        <button
                            style={loadingNotes ? { ...styles.button, opacity: 0.6, backgroundColor: '#007bff' } : { ...styles.button, backgroundColor: '#007bff' }}
                            onClick={handleSaveNote}
                            disabled={loadingNotes}
                        >
                            {loadingNotes ? 'Сохранение...' : 'Сохранить заметку'}
                        </button>
                    </div>

                    <div style={styles.listSection}>
                        {notesList.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>Заметок пока нет.</p> : (
                            notesList.slice().reverse().map((note) => (
                                <div key={note.id} style={styles.noteItem}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '16px', lineHeight: '1.5' }}>{note.content}</p>
                                    <small style={{ color: '#888', display: 'block' }}>
                                        {note.createdAt ? new Date(note.createdAt).toLocaleString('ru-RU') : 'Дата неизвестна'}
                                    </small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { border: '1px solid #ddd', padding: '25px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px' },
    button: { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    linkBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', marginTop: '15px', width: '100%' },
    message: { marginTop: '15px', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '14px' },
    inputSection: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' },
    textarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '15px' },
    noteItem: { 
        backgroundColor: '#fff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '15px', 
        borderLeft: '5px solid #007bff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        color: '#333' // Явно задаем темный цвет текста
    },
    logoutBtn: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }
};

export default App;