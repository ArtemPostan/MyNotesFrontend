import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8080/api/notes";
const AUTH_URL = "http://localhost:8080/api/auth";

function App() {

    // токен теперь в состоянии
    const [token, setToken] = useState(() => localStorage.getItem('userToken'));
    const [activeUser, setActiveUser] = useState(() => localStorage.getItem('username') || '');

    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');

    const [lUser, setLUser] = useState('');
    const [lPass, setLPass] = useState('');
    const [rUser, setRUser] = useState('');
    const [rPass, setRPass] = useState('');

    const isLoggedIn = !!token;

    const handleLogout = useCallback(() => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('username');

        setToken(null);
        setNotes([]);
        setActiveUser('');
    }, []);

    const fetchNotes = useCallback(async (token) => {

    const res = await axios.get(API_URL, {
        headers: { Authorization: `Basic ${token}` }
    });

    return res.data;

}, []);

    useEffect(() => {

    const loadNotes = async () => {

        try {
            const data = await fetchNotes(token);
            setNotes(data);
        } catch (error) {

            console.error("Fetch error:", error);

            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    if (token) {
        loadNotes();
    }

}, [token, fetchNotes, handleLogout]);

    const handleRegister = async (e) => {

        e.preventDefault();

        if (!rUser.trim() || !rPass.trim()) {
            setMessage("Ошибка: Поля не могут быть пустыми!");
            return;
        }

        try {

            await axios.post(`${AUTH_URL}/register`, {
                username: rUser,
                password: rPass
            });

            setMessage("Регистрация ок! Теперь входите.");

            setRUser('');
            setRPass('');

        } catch {

            setMessage("Ошибка: возможно, логин занят");

        }
    };

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const newToken = btoa(`${lUser}:${lPass}`);

            await axios.post(`${AUTH_URL}/login`, null, {
                headers: { 'Authorization': `Basic ${newToken}` }
            });

            localStorage.setItem('userToken', newToken);
            localStorage.setItem('username', lUser);

            setToken(newToken);
            setActiveUser(lUser);

            setLUser('');
            setLPass('');

            setMessage("Вы вошли!");

        } catch {

            setMessage("Неверный логин или пароль");

        }
    };

    const handleSaveNote = async (e) => {

        e.preventDefault();

        try {

            await axios.post(API_URL, { content }, {
                headers: { 'Authorization': `Basic ${token}` }
            });

            setContent('');

            fetchNotes(token);

        } catch {

            alert("Ошибка сохранения");

        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>

            <h2>Notes App 📝</h2>

            {message && <p style={{ color: 'blue' }}>{message}</p>}

            {!isLoggedIn ? (

                <div>

                    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>

                        <h3>Регистрация</h3>

                        <input
                            placeholder="Логин"
                            value={rUser}
                            onChange={e => setRUser(e.target.value)}
                        />

                        <input
                            type="password"
                            placeholder="Пароль"
                            value={rPass}
                            onChange={e => setRPass(e.target.value)}
                        />

                        <button onClick={handleRegister}>Создать</button>

                    </div>

                    <div style={{ border: '1px solid #007bff', padding: '10px' }}>

                        <h3>Вход</h3>

                        <input
                            placeholder="Логин"
                            value={lUser}
                            onChange={e => setLUser(e.target.value)}
                        />

                        <input
                            type="password"
                            placeholder="Пароль"
                            value={lPass}
                            onChange={e => setLPass(e.target.value)}
                        />

                        <button onClick={handleLogin}>Войти</button>

                    </div>

                </div>

            ) : (

                <div>

                    <button onClick={handleLogout} style={{ float: 'right' }}>
                        Выйти
                    </button>

                    <p>Привет, <b>{activeUser}</b></p>

                    <form onSubmit={handleSaveNote}>

                        <input
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Заметка..."
                        />

                        <button type="submit">ОК</button>

                    </form>

                    <ul>
                        {notes.map(n =>
                            <li key={n.id}>{n.content}</li>
                        )}
                    </ul>

                </div>

            )}

        </div>
    );
}

export default App;