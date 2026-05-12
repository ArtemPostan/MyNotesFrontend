import React from 'react';
import s from '../styles/Auth.module.css';

function AuthChoice({ onSelectGuest, onSelectEmail, isLoading }) {
    return (
        <div className={s.authContainer}>
            <div className={s.headerGroup}>
                <h2 className={s.title}>Добро пожаловать</h2>
                <p className={s.subtitle}>Выберите способ входа в MyNotes</p>
            </div>

            <div className={s.buttonGroup}>
                <button 
                    className={s.mainBtn} 
                    onClick={onSelectEmail}
                    disabled={isLoading}
                >
                    Войти через почту
                </button>

                <div className={s.divider}>
                    <span>или</span>
                </div>

                <button 
                    className={s.secondaryBtn} 
                    onClick={onSelectGuest}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className={s.btnFlex}>
                            <div className={s.miniLoader}></div>
                            <span>Создаем аккаунт...</span>
                        </div>
                    ) : (
                        'Продолжить как гость'
                    )}
                </button>
            </div>

            <p className={s.hint}>
                * В гостевом режиме восстановление пароля недоступно без подтвержденной почты.
            </p>
        </div>
    );
}

export default AuthChoice;