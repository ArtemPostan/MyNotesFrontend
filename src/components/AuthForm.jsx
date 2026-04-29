import React, { useState } from 'react';
import s from './Auth.module.css';

function AuthForm({ onLogin, onCancel, onForgot, isLoading }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false); // Состояние шага

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Передаем email, пароль и код (если он уже есть) в App.jsx
        const shouldShowCodeField = await onLogin(email, password, isCodeSent ? code : null);
        
        // Если App.jsx вернул true, значит код отправлен — показываем поле ввода
        if (shouldShowCodeField && !isCodeSent) {
            setIsCodeSent(true);
        }
    };

    return (
        <form className={s.authContainer} onSubmit={handleSubmit}>
            <button type="button" className={s.backLink} onClick={onCancel}>← Назад</button>
            
            {!isCodeSent ? (
                <>
                    <h2>Вход</h2>
                    <input 
                        type="email" placeholder="Email" required
                        value={email} onChange={(e) => setEmail(e.target.value)} 
                    />
                    <input 
                        type="password" placeholder="Пароль" required
                        value={password} onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="button" className={s.linkBtn} onClick={onForgot}>Забыли пароль?</button>
                    <button className={s.mainBtn} disabled={isLoading}>
                        {isLoading ? 'Загрузка...' : 'Продолжить'}
                    </button>
                </>
            ) : (
                <>
                    <h2>Подтверждение</h2>
                    <p>Код отправлен на {email}</p>
                    <input 
                        className={s.codeInput}
                        type="text" maxLength="5" placeholder="00000" required
                        value={code} onChange={(e) => setCode(e.target.value)}
                    />
                    <button className={s.mainBtn} disabled={isLoading}>
                        {isLoading ? 'Проверка...' : 'Войти'}
                    </button>
                </>
            )}
        </form>
    );
}

export default AuthForm;