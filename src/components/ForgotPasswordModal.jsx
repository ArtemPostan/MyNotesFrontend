import React, { useState, useEffect } from 'react';
import s from '../App.module.css';
import { authService } from '../services/authService';

const ForgotPasswordModal = ({ show, onClose, userEmail }) => {
    // Этапы: 'email' (ввод почты), 'code' (ввод кода), 'password' (новые пароли)
    const [step, setStep] = useState('email'); 
    
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Эффект для подстановки email, если пользователь уже что-то вводил в форме входа
    useEffect(() => {
        if (show) {
            setEmail(userEmail || '');
            setStep('email');
            setMessage('');
            resetFields(); // Очищаем пароли при открытии
        }
    }, [show, userEmail]);

    const resetFields = () => {
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    if (!show) return null;

    // Шаг 1: Запрос кода на почту
    const handleSendCode = async () => {
        setLoading(true);
        try {
            await authService.resetPasswordRequest(email);
            setStep('code');
            setMessage("Код отправлен на " + email);
        } catch (err) {
            setMessage(err.response?.data?.message || "Ошибка отправки");
        } finally {
            setLoading(false);
        }
    };

    // Шаг 2: Проверка кода (валидация на бэкенде без смены пароля)
    const handleVerifyCode = async () => {
        setLoading(true);
        try {
            // На бэкенде должен быть метод, который просто проверяет код
            await authService.verifyResetCode(email, code); 
            setStep('password');
            setMessage("");
        } catch {
            setMessage("Неверный код подтверждения");
        } finally {
            setLoading(false);
        }
    };

    // Шаг 3: Финальная смена пароля
    const handleFinalReset = async () => {
        if (newPassword !== confirmPassword) {
            setMessage("Пароли не совпадают");
            return;
        }
        setLoading(true);
        try {
            await authService.resetPasswordConfirm(email, code, newPassword);
            setMessage("Пароль успешно обновлен!");
            setTimeout(() => {
                onClose();
                resetFields();
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.error || "Ошибка сохранения");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.card} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, boxShadow: '0 0 100px rgba(0,0,0,0.8)', minWidth: '300px' }}>
            <h3 style={{ color: '#fff', textAlign: 'center' }}>Восстановление доступа</h3>

            {/* ВЕТВЛЕНИЕ ПО ШАГАМ */}
            {step === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ color: '#ccc', fontSize: '14px' }}>Введите почту для получения кода</p>
                    <input
                        className={s.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <button className={s.button} onClick={handleSendCode} disabled={loading || !email}>
                        {loading ? 'Отправка...' : 'Получить код'}
                    </button>
                </div>
            )}

            {step === 'code' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ color: '#ccc', fontSize: '14px' }}>Код отправлен на {email}</p>
                    <input
                        className={s.input}
                        type="text"
                        placeholder="5-значный код"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        autoComplete="one-time-code"
                    />
                    <button className={s.button} onClick={handleVerifyCode} disabled={loading || code.length < 5}>
                        {loading ? 'Проверка...' : 'Далее'}
                    </button>
                </div>
            )}

            {step === 'password' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ color: '#ccc', fontSize: '14px' }}>Придумайте новый пароль</p>
                    <input
                        className={s.input}
                        type="password"
                        placeholder="Новый пароль"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <input
                        className={s.input}
                        type="password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <button className={s.button} onClick={handleFinalReset} disabled={loading || !newPassword || newPassword !== confirmPassword}>
                        {loading ? 'Сохранение...' : 'Обновить пароль'}
                    </button>
                </div>
            )}

            <button className={s.linkBtn} onClick={onClose} style={{ marginTop: '10px', width: '100%' }}>
                Отмена
            </button>
            
            {message && <div className={s.message} style={{ marginTop: '10px', textAlign: 'center' }}>{message}</div>}
        </div>
    );
};

export default ForgotPasswordModal;