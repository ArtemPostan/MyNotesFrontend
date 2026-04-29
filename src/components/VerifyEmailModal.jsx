import React from 'react';
import s from '../App.module.css';

const VerifyEmailModal = ({ 
    show, 
    email, 
    isCodeSent, 
    code, 
    setCode, 
    isAuthLoading, 
    message, 
    onSendCode, 
    onVerifyCode, 
    onClose,
    setIsCodeSent 
}) => {
    if (!show) return null;

    return (
        <div className={s.card} style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 1000, 
            boxShadow: '0 0 100px rgba(0,0,0,0.8)' 
        }}>
            <h3 style={{ color: '#fff' }}>Безопасность аккаунта</h3>
            
            {!isCodeSent ? (
                <>
                    <p style={{ color: '#ccc', fontSize: '14px' }}>
                        Ваш email <strong>{email}</strong> не подтвержден.
                    </p>
                    <button className={s.button} onClick={onSendCode} disabled={isAuthLoading}>
                        {isAuthLoading ? 'Отправка...' : 'Привязать почту'}
                    </button>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ color: '#ccc', fontSize: '14px' }}>Введите код из письма</p>
                    <input
                        className={s.input}
                        type="text"
                        maxLength="5"
                        placeholder="00000"
                        style={{ textAlign: 'center' }}
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    />
                    <button className={s.button} onClick={onVerifyCode} disabled={isAuthLoading || code.length < 5}>
                        {isAuthLoading ? 'Проверка...' : 'Подтвердить'}
                    </button>
                    <button className={s.linkBtn} onClick={() => setIsCodeSent(false)}>
                        Отправить заново
                    </button>
                </div>
            )}

            <button className={s.linkBtn} onClick={onClose} style={{ marginTop: '10px', color: '#888' }}>
                Позже
            </button>
            
            {message && <div className={s.message} style={{ marginTop: '10px' }}>{message}</div>}
        </div>
    );
};

export default VerifyEmailModal;