import { useState } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [isLogin, setIsLogin] = useState(true);
    const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
    const [showVerifyPrompt, setShowVerifyPrompt] = useState(
        !!localStorage.getItem('token') && localStorage.getItem('isEmailVerified') === 'false'
    );
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [code, setCode] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setIsAuthLoading(true);
        setMessage("");

        try {
            let res;
            if (isLogin) {
                res = await authService.login(formData.email, formData.password);
            } else {
                res = await authService.register(formData);
            }

            // Убеждаемся, что мы НЕ достаем encryption_key, так как он нам больше не нужен
            const { token, name: uName, isEmailVerified } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('isEmailVerified', isEmailVerified);
            localStorage.setItem('userName', uName || formData.email.split('@')[0]);

            // ПРИНУДИТЕЛЬНО удаляем старый ключ шифрования, если он остался от прошлых версий
            localStorage.removeItem('encryption_key');

            setUserName(uName || formData.email.split('@')[0]);
            setIsAuthenticated(true);

            if (!isEmailVerified) {
                setShowVerifyPrompt(true);
                setIsGuest(true);
                localStorage.setItem('isGuest', 'true');
            } else {
                setIsGuest(false);
                localStorage.setItem('isGuest', 'false');
                setShowVerifyPrompt(false);
            }
        } catch (err) {
            const statusCode = err.response?.status;
            const serverMessage = err.response?.data?.message;

            if (isLogin) {
                if (statusCode === 401 || serverMessage === "Invalid password") {
                    setMessage("Неверный пароль. Попробуйте еще раз.");
                } else if (statusCode === 404 || serverMessage === "User not found") {
                    setMessage("Пользователь с таким email не найден.");
                } else {
                    setMessage("Не удалось войти. Проверьте данные.");
                }
            } else {
                if (serverMessage === "Email already in use" || statusCode === 409) {
                    setMessage("Этот email уже занят. Попробуйте войти.");
                } else if (serverMessage === "Password too weak") {
                    setMessage("Слишком простой пароль. Нужно минимум 6 символов.");
                } else {
                    setMessage("Ошибка при регистрации. Попробуйте другой email.");
                }
            }
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = () => {
        // Мы оставляем 'encryption_key' в списке удаления, чтобы окончательно вычистить его у всех юзеров
        const keysToRemove = ['token', 'encryption_key', 'userName', 'isGuest', 'isEmailVerified', 'mynotes_cache'];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        setIsAuthenticated(false);
        setIsGuest(false);
        setUserName('');
        setShowVerifyPrompt(false);
        setMessage("");
        setFormData({ name: '', email: '', password: '' });
    };

    const handleBindEmail = async () => {
        try {
            setIsAuthLoading(true);
            setMessage("");
            await authService.sendVerificationCode(formData.email);
            setMessage("Код отправлен!");
            setIsCodeSent(true);
        } catch (err) {
            const rawData = err.response?.data;
            const rawMessage = typeof rawData === 'string' ? rawData : (rawData?.message || "");

            if (rawMessage.toLowerCase().includes("550") ||
                rawMessage.toLowerCase().includes("terminated") ||
                rawMessage.toLowerCase().includes("unavailable")) {
                setMessage("Эта почта удалена или недоступна (ошибка 550).");
            }
            else if (err.response?.status === 400) {
                setMessage("Сервер отклонил адрес: " + (rawMessage || "некорректный email"));
            }
            else {
                setMessage(rawMessage || "Не удалось отправить код. Попробуйте позже.");
            }
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        try {
            setIsAuthLoading(true);
            await authService.verifyCode(formData.email, code);
            setIsGuest(false);
            setShowVerifyPrompt(false);
            localStorage.setItem('isGuest', 'false');
            localStorage.setItem('isEmailVerified', 'true');
        } catch {
            setMessage("Неверный код.");
        } finally {
            setIsAuthLoading(false);
        }
    };

    return {
        isAuthenticated, isLogin, setIsLogin, isGuest, userName,
        showVerifyPrompt, setShowVerifyPrompt, isAuthLoading, message, setMessage,
        isCodeSent, formData, code, setCode,
        handleInputChange, handleAuth, handleLogout, handleBindEmail, handleVerifyCode
    };
}