import { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { notesService } from './services/notesService';
import s from './App.module.css';
import NoteItem from './components/NoteItem';
import { storageService } from './services/storageService';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function App() {
    // --- СОСТОЯНИЯ ЗАГРУЗКИ ---
    // processingId будет хранить ID заметки, которая сейчас сохраняется
    const [processingId, setProcessingId] = useState(null);
    // isAuthLoading для блокировки экрана только при входе/регистрации
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isServerAwake, setIsServerAwake] = useState(false);

    const cachedNotes = storageService.getNotes() || [];
    const [notesList, setNotesList] = useState(cachedNotes);
    const [isConnecting, setIsConnecting] = useState(cachedNotes.length === 0);

    // --- СОСТОЯНИЯ ПОЛЬЗОВАТЕЛЯ ---
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [message, setMessage] = useState('');
    const [noteText, setNoteText] = useState('');

    const fetchNotes = async () => {
        try {
            const response = await notesService.getAll();
            setNotesList(response.data);
            storageService.saveNotes(response.data);
            setIsServerAwake(true);
        } catch (error) {
            console.error("Ошибка синхронизации:", error);
            if (error.response) setIsServerAwake(true);
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotes();
        } else {
            setIsConnecting(false);
        }
    }, [isAuthenticated]);

    // Универсальная обертка для операций с конкретной заметкой
    const noteRequestWrapper = async (id, callback) => {
        setProcessingId(id); // Включаем "крутилку" для конкретной заметки
        try {
            await callback();
        } catch (error) {
            console.error("Ошибка операции с заметкой:", error);
        } finally {
            setProcessingId(null); // Выключаем
        }
    };

    // --- ОБРАБОТЧИКИ ---

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        // Для создания новой заметки используем спец. ID 'new'
        await noteRequestWrapper('new', async () => {
            try {
                await notesService.create(noteText);
                setNoteText('');
                await fetchNotes();
            } catch (error) {
                alert("Ошибка сохранения: " + (error.response?.data || "Ошибка"));
            }
        });
    };

    const handleUpdateNote = async (id, newContent) => {
        await noteRequestWrapper(id, async () => {
            try {
                const response = await notesService.update(id, newContent);
                const updatedNote = response.data;
                if (updatedNote?.id) {
                    setNotesList(prev => {
                        const newList = prev.map(n => n.id === id ? updatedNote : n);
                        storageService.saveNotes(newList);
                        return newList;
                    });
                }
            } catch (error) {
                console.error("Ошибка обновления:", error);
            }
        });
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm("Удалить заметку?")) return;
        await noteRequestWrapper(id, async () => {
            try {
                await notesService.delete(id);
                const newList = notesList.filter(n => n.id !== id);
                setNotesList(newList);
                storageService.saveNotes(newList);
            } catch {
                alert("Ошибка удаления");
            }
        });
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setIsAuthLoading(true);
        try {
            setMessage("Загрузка...");
            if (isLogin) {
                const res = await authService.login(email, password);
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                    const displayName = res.data.name || email.split('@')[0];
                    localStorage.setItem('userName', displayName);
                    setUserName(displayName);
                    setIsAuthenticated(true);
                    setMessage("");
                }
            } else {
                await authService.register({ email, password, name });
                setIsLogin(true);
                setMessage('Успешно! Войдите.');
            }
        } catch (err) {
            setMessage("Ошибка: " + (err.response?.data?.message || err.response?.data || "Ошибка сервера"));
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        localStorage.removeItem('userName');
        storageService.clear();
        setIsAuthenticated(false);
        setUserName('');
        setNotesList([]);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = notesList.findIndex((n) => n.id === active.id);
            const newIndex = notesList.findIndex((n) => n.id === over.id);

            const newList = arrayMove(notesList, oldIndex, newIndex);

            // 1. Сначала обновляем UI (оптимистично)
            setNotesList(newList);
            storageService.saveNotes(newList);

            // 2. Отправляем на бэкенд
            try {
                await notesService.reorder(newList.map(n => n.id));
            } catch (error) {
                console.error("Не удалось сохранить порядок на сервере", error);
                // Тут можно вернуть старый список, если критично
            }
        }
    };

    // --- РЕНДЕР ---

    if (isConnecting && notesList.length === 0 && isAuthenticated) {
        return (
            <div className={s.connectingOverlay}>
                <div className={s.loader}></div>
                <h2>Синхронизация...</h2>
                <p>Просыпаемся (Serverless Cold Start)</p>
            </div>
        );
    }

    return (
        <div className={s.container}>
            <div className={s.serverStatus}>
                <span className={isServerAwake ? s.online : s.offline}></span>
                {isServerAwake ? 'Сервер онлайн' : 'Сервер спит'}
            </div>

            <header style={{ padding: '20px 0' }}>
                <h1 style={{ textAlign: 'center', margin: 0, color: '#fff' }}>MyNotes 📝</h1>
            </header>

            {!isAuthenticated ? (
                <div className={s.card}>
                    {/* Плашка только для экрана логина */}
                    {isAuthLoading && <div className={s.loader} style={{ margin: '0 auto 10px' }}></div>}

                    <h3 style={{ textAlign: 'center', color: '#fff' }}>{isLogin ? 'Вход' : 'Регистрация'}</h3>
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!isLogin && (
                            <input className={s.input} type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
                        )}
                        <input className={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <input className={s.input} type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
                        <button className={s.button} type="submit" disabled={isAuthLoading}>
                            {isLogin ? 'Войти' : 'Создать аккаунт'}
                        </button>
                    </form>
                    <button className={s.linkBtn} onClick={() => { setIsLogin(!isLogin); setMessage(""); }}>
                        {isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}
                    </button>
                    {message && <div className={s.message}>{message}</div>}
                </div>
            ) : (
                <>
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
                                {/* Если идет сохранение, показываем лоадер, если нет — текст */}
                                {processingId === 'new' ? (
                                    <div className={s.btnLoader}></div>
                                ) : (
                                    'Сохранить'
                                )}
                            </button>
                        </div>
                    </header>

                    <main className={s.listSection}>
                        {notesList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '60px' }}>
                                <p>Заметок нет</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={notesList.map(n => n.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {/* Убираем лишний <main> здесь, 
                   так как он уже есть снаружи. 
                */}
                                    <div className={s.dragListWrapper}>
                                        {notesList.map(note => (
                                            <NoteItem
                                                key={note.id}
                                                note={note}
                                                onDelete={handleDeleteNote}
                                                onUpdate={handleUpdateNote}
                                                isUpdating={processingId === note.id}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </main>
                </>
            )}
        </div>
    );
}

export default App;