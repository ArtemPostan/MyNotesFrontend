import React, { useState } from 'react';
import s from './App.module.css';

// Хуки
import { useNotes } from './hooks/useNotes'; 
import { useAuth } from './hooks/useAuth'; 

// Компоненты
import NoteItem from './components/NoteItem';
import VerifyEmailModal from './components/VerifyEmailModal';
import AuthForm from './components/AuthForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';

// DnD Kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function App() {
    // Подключаем логику авторизации
    const auth = useAuth();
    
    // Состояния интерфейса, которые не относятся напрямую к бизнес-логике auth
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [noteText, setNoteText] = useState('');

    // Подключаем логику заметок
    const {
        notesList, isConnecting, processingId, isServerAwake,
        handleSaveNote, handleUpdateNote, handleDeleteNote, handleDragEnd
    } = useNotes(auth.isAuthenticated);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    if (isConnecting && notesList.length === 0 && auth.isAuthenticated) {
        return (
            <div className={s.connectingOverlay}>
                <div className={s.loader}></div>
                <h2>Синхронизация...</h2>
            </div>
        );
    }

    return (
        <div className={s.container}>
            {/* Статус сервера */}
            <div className={s.serverStatus}>
                <span className={isServerAwake ? s.online : s.offline}></span>
                {isServerAwake ? 'Сервер онлайн' : 'Сервер спит'}
            </div>

            <header style={{ padding: '20px 0' }}>
                <h1 style={{ textAlign: 'center', margin: 0, color: '#fff' }}>MyNotes 📝</h1>
            </header>

            {!auth.isAuthenticated ? (
                <AuthForm
                    isLogin={auth.isLogin}
                    setIsLogin={auth.setIsLogin}
                    isAuthLoading={auth.isAuthLoading}
                    message={auth.message}
                    setMessage={auth.setMessage}
                    handleAuth={auth.handleAuth}
                    formData={auth.formData}
                    onChange={auth.handleInputChange}
                    onForgotClick={() => setShowForgotModal(true)}
                />
            ) : (
                <>
                    <VerifyEmailModal
                        show={auth.showVerifyPrompt}
                        email={auth.formData.email}
                        isCodeSent={auth.isCodeSent}
                        code={auth.code}
                        setCode={auth.setCode}
                        isAuthLoading={auth.isAuthLoading}
                        message={auth.message}
                        onSendCode={auth.handleBindEmail}
                        onVerifyCode={auth.handleVerifyCode}
                        onClose={() => auth.setShowVerifyPrompt(false)}
                    />

                    <header className={s.stickyHeader}>
                        <div className={s.header}>
                            <h3 style={{ margin: 0, color: '#fff' }}>
                                {auth.userName} {auth.isGuest && <small style={{ opacity: 0.5 }}>(Гость)</small>}
                            </h3>
                            <button onClick={auth.handleLogout} className={s.logoutBtn}>Выйти</button>
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
                userEmail={auth.formData.email}
            />
        </div>
    );
}

export default App;