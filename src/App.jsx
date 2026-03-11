import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');

    // Переменная для отображения имени в шапке
    const [activeUser, setActiveUser] = useState('');

    // Поля формы Входа
    const [lUser, setLUser] = useState('');
    const [lPass, setLPass] = useState('');

    // Поля формы Регистрации
    const [rUser, setRUser] = useState('');
    const [rPass, setRPass] = useState('');

    const API_URL = "http://localhost:8080/api/notes";
    const AUTH_URL = "http://localhost:8080/api/auth";

    useEffect(() => {
        const savedToken = localStorage.getItem('userToken');
        const savedUsername = localStorage.getItem('username');
        if (savedToken && savedUsername) {
            setIsLoggedIn(true);
            setActiveUser(savedUsername);
            fetchNotes(savedToken);
        }
    }, []);

    const fetchNotes = async (token) => {
        try {
            const res = await axios.get(API_URL, {
                headers: { 'Authorization': `Basic ${token}` }
            });
            setNotes(res.data);
        } catch (e) {
            if (e.response?.status === 401) handleLogout();
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!rUser.trim() || !rPass.trim()) {
            setMessage("Ошибка: Поля не могут быть пустыми!");
            return;
        }
        try {
            await axios.post(`${AUTH_URL}/register`, { username: rUser, password: rPass });
            setMessage("Регистрация ок! Теперь входите.");
            setRUser(''); setRPass('');
        } catch (e) {
            setMessage("Ошибка: возможно, логин занят");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const token = btoa(`${lUser}:${lPass}`);
            await axios.post(`${AUTH_URL}/login`, null, {
                headers: { 'Authorization': `Basic ${token}` }
            });

            localStorage.setItem('userToken', token);
            localStorage.setItem('username', lUser);

            setIsLoggedIn(true);
            setActiveUser(lUser);
            fetchNotes(token);
            setLUser(''); setLPass('');
            setMessage("Вы вошли!");
        } catch (e) {
            setMessage("Неверный логин или пароль");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setNotes([]);
        setActiveUser('');
    };

    const handleSaveNote = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('userToken');
        try {
            await axios.post(API_URL, { content }, {
                headers: { 'Authorization': `Basic ${token}` }
            });
            setContent('');
            fetchNotes(token);
        } catch (e) { alert("Ошибка сохранения"); }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>Notes App 📝</h2>
            {message && <p style={{ color: 'blue' }}>{message}</p>}

            {!isLoggedIn ? (
                <div>
                    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h3>Регистрация</h3>
                        <input placeholder="Логин" value={rUser}
                               onChange={e => setRUser(e.target.value)}
                               required/>
                        <input type="password"
                               placeholder="Пароль" value={rPass}
                               onChange={e => setRPass(e.target.value)}
                               required/>
                        <button onClick={handleRegister}>Создать</button>
                    </div>
                    <div style={{ border: '1px solid #007bff', padding: '10px' }}>
                        <h3>Вход</h3>
                        <input placeholder="Логин" value={lUser} onChange={e => setLUser(e.target.value)} />
                        <input type="password" placeholder="Пароль" value={lPass}
                               onChange={e => setLPass(e.target.value)} />
                        <button onClick={handleLogin}>Войти</button>
                    </div>
                </div>
            ) : (
                <div>
                    <button onClick={handleLogout} style={{ float: 'right' }}>Выйти</button>
                    <p>Привет, <b>{activeUser}</b></p>
                    <form onSubmit={handleSaveNote}>
                        <input value={content} onChange={e => setContent(e.target.value)} placeholder="Заметка..." />
                        <button type="submit">ОК</button>
                    </form>
                    <ul>
                        {notes.map(n => <li key={n.id} style={{color: '#333'}}>{n.content}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;