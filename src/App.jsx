import React, { useState } from 'react';
import s from './styles/App.module.css';

// Хуки
import { useNotes } from './hooks/useNotes';
import { useAuth } from './hooks/useAuth';

// Компоненты
import NoteItem from './components/NoteItem';
import NoteInput from './components/NoteInput';
import VerifyEmailModal from './components/VerifyEmailModal';
import AuthForm from './components/AuthForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';

// DnD Kit
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function App() {
    const auth = useAuth();
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [noteText, setNoteText] = useState('');

    const {
        notesList,
        isReady,
        processingId,
        isServerAwake,
        handleSaveNote,
        handleUpdateNote,
        handleDeleteNote,
        handleToggleCollapse,
        handleDragEnd
    } = useNotes(auth.isAuthenticated);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 8 }
    }));

    // Определяем, нужно ли показывать слой "просыпания"
    const showWakeUpOverlay = auth.isAuthenticated && (!isServerAwake || !isReady);

    return (
        <div className={s.container}>
            {/* Слой затемнения, если сервер спит (не блокирует весь экран, а накладывается сверху) */}
            {showWakeUpOverlay && (
                <div className={s.wakeUpOverlay}>
                    <div className={s.wakeUpContent}>
                        <div className={s.btnLoader}></div>
                        <span>{!isServerAwake ? "Сервер просыпается..." : "Дешифровка..."}</span>
                    </div>
                </div>
            )}

            {/* Статус сервера в углу (маленькая точка) */}
            <div className={s.serverStatus}>
                <span className={isServerAwake ? s.online : s.offline}></span>
                {processingId ? 'Синхронизация...' : isServerAwake ? 'В сети' : 'Сервер спит'}
            </div>

            <header style={{ padding: '10px 0' }}>
                <h1 style={{ textAlign: 'center', margin: 0, color: '#fff', fontSize: '1.5rem' }}>MyNotes 📝</h1>
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
                <div className={showWakeUpOverlay ? s.blurredContent : ''}>
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

                    <NoteInput
                        userName={auth.userName}
                        isGuest={auth.isGuest}
                        handleLogout={auth.handleLogout}
                        noteText={noteText}
                        setNoteText={setNoteText}
                        handleSaveNote={() => handleSaveNote(noteText, setNoteText)}
                        processingId={processingId}
                        disabled={!isServerAwake}
                    />

                    <main className={s.listSection}>
                        {notesList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '60px' }}>
                                <p>Заметок пока нет</p>
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
                                    <div className={s.dragListWrapper}>
                                        {notesList.map(note => (
                                            <NoteItem
                                                key={note.id}
                                                note={note}
                                                onDelete={handleDeleteNote}
                                                onUpdate={handleUpdateNote}
                                                onToggleCollapse={handleToggleCollapse}
                                                isUpdating={processingId === note.id}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </main>
                </div>
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