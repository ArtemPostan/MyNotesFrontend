import React from 'react';
import s from '../App.module.css';

const AuthForm = ({
    isLogin,
    setIsLogin,
    isAuthLoading,
    message,
    setMessage,
    handleAuth,
    formData,
    setFormData,
    onForgotClick
}) => {

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={s.card}>
            {/* Добавляем обертку authForm, чтобы стили применились правильно */}
            <div className={s.authForm}>
                {isAuthLoading && <div className={s.loader} style={{ margin: '0 auto 10px' }}></div>}
                
                <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: '20px' }}>
                    {isLogin ? 'Вход' : 'Регистрация'}
                </h3>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!isLogin && (
                        <input
                            className={s.input}
                            type="text"
                            name="name"
                            placeholder="Имя"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                        />
                    )}
                    <input
                        className={s.input}
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email" 
                        required
                    />
                    <input
                        className={s.input}
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                    />

                    {isLogin && (
                        <button
                            type="button"
                            className={s.linkBtn}
                            style={{ alignSelf: 'flex-end', fontSize: '12px', marginTop: '0', width: 'auto' }}
                            onClick={onForgotClick}
                        >
                            Забыли пароль?
                        </button>
                    )}

                    <button className={s.button} type="submit" disabled={isAuthLoading}>
                        {isLogin ? 'Войти' : 'Создать аккаунт'}
                    </button>
                </form>

                <button 
                    className={s.linkBtn} 
                    onClick={() => { setIsLogin(!isLogin); setMessage(""); }}
                    style={{ marginTop: '20px' }}
                >
                    {isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}
                </button>

                {message && <div className={s.message} style={{ marginTop: '15px', textAlign: 'center' }}>{message}</div>}
            </div>
        </div>
    );
};

export default AuthForm;