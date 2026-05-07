import React, { useState} from 'react';
import { authService } from './services/authService';
import s from './App.module.css';

// Хуки
import { useNotes } from './hooks/useNotes'; 

// Компоненты
import NoteItem from './components/NoteItem';
import VerifyEmailModal from './components/VerifyEmailModal';
import AuthForm from './components/AuthForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';

// DnD Kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function App() {
    // --- СОСТОЯНИЯ АВТОРИЗАЦИИ ---
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [isLogin, setIsLogin] = useState(true);
    const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [showVerifyPrompt, setShowVerifyPrompt] = useState(
        !!localStorage.getItem('token') && localStorage.getItem('isEmailVerified') === 'false'
    );

    // --- СОСТОЯНИЯ ИНТЕРФЕЙСА ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [noteText, setNoteText] = useState('');
    
    // Модалки
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [code, setCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);

    // --- ПОДКЛЮЧЕНИЕ КАСТОМНОГО ХУКА ---
    const {
        notesList,
        isConnecting,
        processingId,
        isServerAwake,
        handleSaveNote,
        handleUpdateNote,
        handleDeleteNote,
        handleDragEnd
    } = useNotes(isAuthenticated);

    // --- ОБРАБОТЧИКИ ВВОДА ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

    const handleLogout = () => {
        const keysToRemove = ['token', 'encryption_key', 'userName', 'isGuest', 'isEmailVerified', 'mynotes_cache'];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        setIsAuthenticated(false);
        setIsGuest(false);
        setUserName('');
        setShowVerifyPrompt(false);
        setMessage("");
        setFormData({ name: '', email: '', password: '' });
    };

    const handleBindEmail = async () => {
        try {
            setIsAuthLoading(true);
            await authService.sendVerificationCode(formData.email);
            setMessage("Код отправлен!");
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
            setIsGuest(false);
            setShowVerifyPrompt(false);
            localStorage.setItem('isGuest', 'false');
            localStorage.setItem('isEmailVerified', 'true');
        } catch {
            setMessage("Неверный код.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    // --- НАСТРОЙКИ DRAG & DROP ---
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // --- LOADING SCREEN ---
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
                    onForgotClick={() => setShowForgotModal(true)}
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
                        onClose={() => setShowVerifyPrompt(false)}
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
                            <button 
                                className={s.button} 
                                onClick={() => handleSaveNote(noteText, setNoteText)} 
                                disabled={processingId === 'new' || !noteText.trim()}
                            >
                                {processingId === 'new' ? <div className={s.btnLoader}></div> : 'Сохранить'}
                            </button>
                        </div>
                    </header>

                    <main className={s.listSection}>
                        {notesList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '60px' }}>
                                <p>Заметок нет</p>
                            </div>
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

            <ForgotPasswordModal
                show={showForgotModal}
                onClose={() => setShowForgotModal(false)}
                userEmail={formData.email}
            />
        </div>
    );
}

export default App;