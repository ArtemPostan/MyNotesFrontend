import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { notesService } from './services/notesService';
import { storageService } from './services/storageService';
import s from './App.module.css';

// Компоненты
import NoteItem from './components/NoteItem';
import VerifyEmailModal from './components/VerifyEmailModal';
import AuthForm from './components/AuthForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
// DnD Kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function App() {
    // --- СОСТОЯНИЯ АВТОРИЗАЦИИ ---
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [isLogin, setIsLogin] = useState(true);
    const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');
    const [showVerifyPrompt, setShowVerifyPrompt] = useState(
        !!localStorage.getItem('token') && localStorage.getItem('isEmailVerified') === 'false'
    );

    // Данные полей 
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    // Системные состояния
    const [message, setMessage] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [isServerAwake, setIsServerAwake] = useState(false);

    // Данные заметок
    const cachedNotes = storageService.getNotes() || [];
    const [notesList, setNotesList] = useState(cachedNotes);
    const [isConnecting, setIsConnecting] = useState(cachedNotes.length === 0);
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [noteText, setNoteText] = useState('');

    // Верификация и модалки
    const [code, setCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    // --- УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК ИНПУТОВ ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                res = await authService.login(formData.email, formData.password);
            } else {
                res = await authService.register(formData);
            }

            const { token, name: uName, isEmailVerified } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('isEmailVerified', isEmailVerified);
            localStorage.setItem('userName', uName || formData.email.split('@')[0]);
            setUserName(uName || formData.email.split('@')[0]);
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
            await authService.sendVerificationCode(formData.email);
            setMessage("Код отправлен! Проверьте почту.");
            setIsCodeSent(true);
        } catch {
            setMessage("Не удалось отправить код.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        try {
            setIsAuthLoading(true);
            await authService.verifyCode(formData.email, code);
            setMessage("Email успешно подтвержден!");
            setIsGuest(false);
            setShowVerifyPrompt(false);
            localStorage.setItem('isGuest', 'false');
            localStorage.setItem('isEmailVerified', 'true');
        } catch {
            setMessage("Неверный код или срок действия истек.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleContinueAsGuest = () => {
        setShowVerifyPrompt(false);
        setIsCodeSent(false);
        setMessage("");
    };

    const handleLogout = () => {
        authService.logout();
        localStorage.clear();
        setIsAuthenticated(false);
        setIsGuest(false);
        setUserName('');
        setNotesList([]);
        setShowVerifyPrompt(false);
        setIsCodeSent(false);
        setFormData({ name: '', email: '', password: '' });
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
                <AuthForm
                    isLogin={isLogin}
                    setIsLogin={setIsLogin}
                    isAuthLoading={isAuthLoading}
                    message={message}
                    setMessage={setMessage}
                    handleAuth={handleAuth}
                    formData={formData}
                    onChange={handleInputChange}
                    setFormData={setFormData}
                    onForgotClick={() => {
                        setMessage(""); // Очищаем ошибки перед открытием модалки
                        setShowForgotModal(true);
                    }}
                />
            ) : (
                <>
                    <VerifyEmailModal
                        show={showVerifyPrompt}
                        email={formData.email}
                        isCodeSent={isCodeSent}
                        code={code}
                        setCode={setCode}
                        isAuthLoading={isAuthLoading}
                        message={message}
                        onSendCode={handleBindEmail}
                        onVerifyCode={handleVerifyCode}
                        onClose={handleContinueAsGuest}
                        setIsCodeSent={setIsCodeSent}
                    />

                    <header className={s.stickyHeader}>
                        <div className={s.header}>
                            <h3 style={{ margin: 0, color: '#fff' }}>
                                {userName} {isGuest && <small style={{ opacity: 0.5 }}>(Гость)</small>}
                            </h3>
                            <button onClick={handleLogout} className={s.logoutBtn}>Выйти</button>
                        </div>
                        <div className={s.inputSection}>
                            <textarea
                                className={s.textarea}
                                placeholder="Ваша заметка..."
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                            />
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

            {/* Модалка восстановления с передачей email из формы */}
            <ForgotPasswordModal
                show={showForgotModal}
                onClose={() => setShowForgotModal(false)}
                userEmail={formData.email} 
            />
        </div>
    );
}

export default App;