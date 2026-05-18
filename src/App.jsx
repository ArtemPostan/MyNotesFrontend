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

    // Добавили извлечение переменной isSyncing из хука useNotes
    const {
        notesList,
        isReady,
        processingId,
        isServerAwake,
        isSyncing,
        processQueue,
        handleSaveNote,
        handleUpdateNote,
        handleDeleteNote,
        handleToggleCollapse,
        handleDragEnd
    } = useNotes(auth.isAuthenticated);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 8 }
    }));

    // ИЗМЕНЕНО: Слой "Дешифровка" показываем ТОЛЬКО при первой загрузке (пока кэш готовится).
    // Если сервер спит, мы больше НЕ блокируем интерфейс этим оверлеем.
    const showInitialLoading = auth.isAuthenticated && !isReady;

    return (
        <div className={s.container}>
            {/* Первоначальная загрузка/дешифровка при входе в приложение */}
            {showInitialLoading && (
                <div className={s.wakeUpOverlay}>
                    <div className={s.initialLoader}></div>
                    <span>Вход...</span>
                </div>
            )}

            {/* Статус сервера в углу (маленькая точка) */}
            <div
                className={s.serverStatus}
                onClick={() => !isServerAwake && processQueue()}
                style={{ cursor: !isServerAwake ? 'pointer' : 'default' }}
            >
                <span className={isServerAwake ? s.online : s.offline}></span>
                {isSyncing || processingId
                    ? 'Синхронизация...'
                    : isServerAwake
                        ? 'В сети'
                        : 'Сервер спит (Нажмите для проверки)'}
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
                // Убрали размытие контента (blurredContent), если сервер просто спит
                <div className={showInitialLoading ? s.blurredContent : ''}>
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
                        disabled={false} // ИЗМЕНЕНО: Разрешаем ввод текста в ЛЮБОМ случае, даже если сервер спит!
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