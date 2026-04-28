import s from '../App.module.css';

function AuthForm({ 
    isLogin, setIsLogin, 
    email, setEmail, 
    password, setPassword, 
    name, setName, 
    handleAuth, message, isAuthLoading 
}) {
    return (
        <div className={s.card}>
            {isAuthLoading && <div className={s.loader} style={{ margin: '0 auto 10px' }}></div>}
            <h3 style={{ textAlign: 'center', color: '#fff' }}>{isLogin ? 'Вход' : 'Регистрация'}</h3>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isLogin && (
                    <input className={s.input} type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
                )}
                <input className={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input className={s.input} type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
                <button className={s.button} type="submit" disabled={isAuthLoading}>
                    {isLogin ? 'Войти' : 'Создать аккаунт'}
                </button>
            </form>
            <button className={s.linkBtn} onClick={() => { setIsLogin(!isLogin); }}>
                {isLogin ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}
            </button>
            {message && <div className={s.message}>{message}</div>}
        </div>
    );
}

export default AuthForm;