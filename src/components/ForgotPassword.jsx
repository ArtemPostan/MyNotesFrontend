import React, { useState } from 'react';
import s from './Auth.module.css';

function ForgotPassword({ onCancel }) {
    const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [passwords, setPasswords] = useState({ p1: '', p2: '' });

    return (
        <div className={s.authContainer}>
            <button className={s.backLink} onClick={onCancel}>← К логину</button>
            
            {step === 1 && (
                <>
                    <h2>Восстановление</h2>
                    <input type="email" placeholder="Ваша почта" value={email} onChange={e => setEmail(e.target.value)} />
                    <button className={s.mainBtn} onClick={() => setStep(2)}>Отправить код</button>
                </>
            )}

            {step === 2 && (
                <>
                    <h2>Введите код</h2>
                    <input type="text" maxLength="5" placeholder="5 цифр" value={code} onChange={e => setCode(e.target.value)} className={s.codeInput}/>
                    <button className={s.mainBtn} onClick={() => setStep(3)}>Далее</button>
                </>
            )}

            {step === 3 && (
                <>
                    <h2>Новый пароль</h2>
                    <input type="password" placeholder="Новый пароль" value={passwords.p1} onChange={e => setPasswords({...passwords, p1: e.target.value})} />
                    <input type="password" placeholder="Повторите пароль" value={passwords.p2} onChange={e => setPasswords({...passwords, p2: e.target.value})} />
                    <button className={s.mainBtn}>Сбросить пароль</button>
                </>
            )}
        </div>
    );
}

export default ForgotPassword;