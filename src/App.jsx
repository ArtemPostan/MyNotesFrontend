import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { notesService } from './services/notesService';
import { storageService } from './services/storageService';
import s from './App.module.css';

// Компоненты
import NoteItem from './components/NoteItem';

// DnD Kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function App() {
    // --- СОСТОЯНИЯ АВТОРИЗАЦИИ ---
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [isLogin, setIsLogin] = useState(true);
    const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
    const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');

    // Данные полей
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    
    // Системные состояния
    const [processingId, setProcessingId] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isServerAwake, setIsServerAwake] = useState(false);
    const [message, setMessage] = useState('');

    // Данные заметок
    const cachedNotes = storageService.getNotes() || [];
    const [notesList, setNotesList] = useState(cachedNotes);
    const [isConnecting, setIsConnecting] = useState(cachedNotes.length === 0);
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [noteText, setNoteText] = useState('');

    // --- СИНХРОНИЗАЦИЯ ЗАМЕТОК ---
    const fetchNotes = async () => {
        try {
            const response = await notesService.getAll();
            setNotesList(response.data);
            storageService.saveNotes(response.data);
            setIsServerAwake(true);
        } catch (error) {
            if (error.response) setIsServerAwake(true);
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchNotes();
    }, [isAuthenticated]);

    // --- ОБРАБОТЧИКИ АВТОРИЗАЦИИ ---

    const handleAuth = async (e) => {
        e.preventDefault();
        setIsAuthLoading(true);
        setMessage("");

        try {
            let res;
            if (isLogin) {
                res = await authService.login(email, password);
            } else {
                res = await authService.register({ name, email, password });
            }

            const { token, name: uName, isEmailVerified } = res.data;

            // 1. Сохраняем данные СРАЗУ, чтобы работал notesService
            localStorage.setItem('token', token);
            localStorage.setItem('userName', uName || email.split('@')[0]);
            setUserName(uName || email.split('@')[0]);
            
            // 2. Активируем статус авторизации, чтобы fetchNotes и другие функции начали работать
            setIsAuthenticated(true);

            if (!isEmailVerified) {
                setShowVerifyPrompt(true);
                setIsGuest(true);
                localStorage.setItem('isGuest', 'true');
            } else {
                setIsGuest(false);
                localStorage.setItem('isGuest', 'false');
                setShowVerifyPrompt(false);
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Ошибка авторизации");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleBindEmail = async () => {
        try {
            setIsAuthLoading(true);
            await authService.sendVerificationCode(email);
            setMessage("Код отправлен! Проверьте почту.");
        } catch {
            setMessage("Не удалось отправить код.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        localStorage.clear();
        setIsAuthenticated(false);
        setIsGuest(false);
        setUserName('');
        setNotesList([]);
        setShowVerifyPrompt(false);
        setMessage("");
    };

    // --- ОБРАБОТЧИКИ ЗАМЕТОК ---

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        setProcessingId('new');
        try {
            await notesService.create(noteText);
            setNoteText('');
            await fetchNotes();
        } catch {
            setMessage("Ошибка при сохранении заметки");
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpdateNote = async (id, newText) => {
        setProcessingId(id);
        try {
            await notesService.update(id, newText);
            await fetchNotes();
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm("Удалить заметку?")) return;
        setProcessingId(id);
        try {
            await notesService.delete(id);
            await fetchNotes();
        } finally {
            setProcessingId(null);
        }
    };

    // --- DRAG & DROP ---
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = notesList.findIndex((n) => n.id === active.id);
            const newIndex = notesList.findIndex((n) => n.id === over.id);
            const newList = arrayMove(notesList, oldIndex, newIndex);
            
            setNotesList(newList);
            storageService.saveNotes(newList);

            try {
                await notesService.reorder(newList.map(n => n.id));
            } catch {
                console.error("Ошибка сохранения порядка");
            }
        }
    };

    // --- РЕНДЕР ---

    if (isConnecting && notesList.length === 0 && isAuthenticated) {
        return (
            <div className={s.connectingOverlay}>
                <div className={s.loader}></div>
                <h2>Синхронизация...</h2>
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
                    {isAuthLoading && <div className={s.loader} style={{ margin: '0 auto 10px' }}></div>}
                    <h3 style={{ textAlign: 'center', color: '#fff' }}>{isLogin ? 'Вход' : 'Регистрация'}</h3>
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!isLogin && (
                            <input className={s.input} type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
                        )}
                        <input className={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <input className={s.input} type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
                        
                        {isLogin && <button type="button" className={s.linkBtn} style={{alignSelf: 'flex-end', fontSize: '12px'}}>Забыли пароль?</button>}

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
                    {/* ОКНО ПРЕДЛОЖЕНИЯ ПОДТВЕРЖДЕНИЯ (Отображается поверх основного контента) */}
                    {showVerifyPrompt && (
                        <div className={s.card} style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, boxShadow: '0 0 100px rgba(0,0,0,0.8)'}}>
                            <h3 style={{ color: '#fff' }}>Почта не подтверждена</h3>
                            <p style={{ color: '#ccc', fontSize: '14px' }}>Подтвердите Email, чтобы заметки не потерялись.</p>
                            <button className={s.button} onClick={handleBindEmail} disabled={isAuthLoading}>
                                {isAuthLoading ? 'Отправка...' : 'Привязать почту'}
                            </button>
                            <button className={s.linkBtn} onClick={() => setShowVerifyPrompt(false)} style={{ marginTop: '10px' }}>
                                Продолжить как гость
                            </button>
                            {message && <div className={s.message}>{message}</div>}
                        </div>
                    )}

                    <header className={s.stickyHeader}>
                        <div className={s.header}>
                            <h3 style={{ margin: 0, color: '#fff' }}>
                                {userName} {isGuest && <small style={{opacity: 0.5}}>(Гость)</small>}
                            </h3>
                            <button onClick={handleLogout} className={s.logoutBtn}>Выйти</button>
                        </div>
                        <div className={s.inputSection}>
                            <textarea className={s.textarea} placeholder="Ваша заметка..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                            <button className={s.button} onClick={handleSaveNote} disabled={processingId === 'new' || !noteText.trim()}>
                                {processingId === 'new' ? <div className={s.btnLoader}></div> : 'Сохранить'}
                            </button>
                        </div>
                    </header>

                    <main className={s.listSection}>
                        {notesList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '60px' }}><p>Заметок нет</p></div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={notesList.map(n => n.id)} strategy={verticalListSortingStrategy}>
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