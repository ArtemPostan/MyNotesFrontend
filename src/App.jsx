import { useState, useEffect } from 'react';
import axios from 'axios';

// Если тестируешь локально — используй localhost. 
// Если в облаке — замени на свой URL из Яндекс.Облака.
const API_URL = "https://bbac22ncehpq498kutp5.containers.yandexcloud.net";

function App() {
    const [users, setUsers] = useState([]);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Добавили стейт для имени
    const [message, setMessage] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
        } catch (err) {
            console.error("Ошибка загрузки списка:", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchUsers();
        };
        loadData();
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        // ВАЖНО: Путь должен совпадать с @RequestMapping в Java
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        const payload = isLogin
            ? { email, password }
            : { email, password, name }; // Для регистрации отправляем еще и имя

        try {
            setMessage("Загрузка...");
            const res = await axios.post(`${API_URL}${endpoint}`, payload);

            setMessage(`Успех: ${isLogin ? 'Вы вошли!' : 'Вы зарегистрированы!'}`);
            console.log("Ответ сервера:", res.data);

            if (isLogin) {
                // Пока просто выводим имя вошедшего
                setMessage(`Привет, ${res.data.name || 'пользователь'}!`);
            } else {
                // После регистрации очистим форму и переключим на вход
                setTimeout(() => {
                    setIsLogin(true);
                    setMessage('Теперь войдите в аккаунт');
                }, 2000);
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            const errorMsg = err.response?.data?.message || err.response?.data || "Ошибка сервера";
            setMessage("Ошибка: " + errorMsg);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
            <h1>MyNotes 📝</h1>

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h3>{isLogin ? 'Вход' : 'Регистрация'}</h3>
                <form onSubmit={handleAuth}>
                    {!isLogin && ( // Поле имени показываем только при регистрации
                        <div style={{ marginBottom: '10px' }}>
                            <input
                                style={{ width: '100%', padding: '8px' }}
                                type="text" placeholder="Ваше имя" value={name}
                                onChange={e => setName(e.target.value)} required
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            style={{ width: '100%', padding: '8px' }}
                            type="email" placeholder="Email" value={email}
                            onChange={e => setEmail(e.target.value)} required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            style={{ width: '100%', padding: '8px' }}
                            type="password" placeholder="Пароль" value={password}
                            onChange={e => setPassword(e.target.value)} required
                        />
                    </div>
                    <button style={{
                        width: '100%', padding: '10px',
                        backgroundColor: isLogin ? '#007bff' : '#28a745',
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }} type="submit">
                        {isLogin ? 'Войти' : 'Создать аккаунт'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                    <button
                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
                    >
                        {isLogin ? 'Зарегистрироваться' : 'Войти'}
                    </button>
                </p>

                {message && (
                    <div style={{
                        marginTop: '10px', padding: '10px', borderRadius: '4px', textAlign: 'center',
                        backgroundColor: message.includes('Ошибка') ? '#ffebee' : '#e8f5e9',
                        color: message.includes('Ошибка') ? '#c62828' : '#2e7d32'
                    }}>
                        {message}
                    </div>
                )}
            </div>

            <hr style={{ margin: '30px 0' }} />

            <h4>Тестовый список из БД:</h4>
            <button onClick={fetchUsers}>🔄 Обновить список</button>
            <ul style={{ paddingLeft: '20px' }}>
                {users.map(u => (
                    <li key={u.id} style={{ fontSize: '12px', marginBottom: '5px' }}>
                        <strong>{u.name || 'Без имени'}</strong> ({u.email})
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;