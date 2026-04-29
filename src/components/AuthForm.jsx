import React from 'react';
import s from '../App.module.css';

const AuthForm = ({ 
    isLogin, 
    setIsLogin, 
    isAuthLoading, 
    message, 
    setMessage,
    handleAuth,
    formData, // Объект со всеми полями
    setFormData 
}) => {
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={s.card}>
            {isAuthLoading && <div className={s.loader} style={{ margin: '0 auto 10px' }}></div>}
            <h3 style={{ textAlign: 'center', color: '#fff' }}>
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
                    required 
                />
                <input 
                    className={s.input} 
                    type="password" 
                    name="password"
                    placeholder="Пароль" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                />

                {isLogin && (
                    <button type="button" className={s.linkBtn} style={{ alignSelf: 'flex-end', fontSize: '12px' }}>
                        Забыли пароль?
                    </button>
                )}

                <button className={s.button} type="submit" disabled={isAuthLoading}>
                    {isLogin ? 'Войти' : 'Создать аккаунт'}
                </button>
            </form>

            <button className={s.linkBtn} onClick={() => { setIsLogin(!isLogin); setMessage(""); }}>
                {isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}
            </button>
            
            {message && <div className={s.message}>{message}</div>}
        </div>
    );
};

export default AuthForm;