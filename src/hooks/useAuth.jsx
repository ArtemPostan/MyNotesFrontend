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

            const { token, name: uName, isEmailVerified } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('isEmailVerified', isEmailVerified);
            localStorage.setItem('userName', uName || formData.email.split('@')[0]);
            
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
            setMessage(err.response?.data?.message || "Ошибка авторизации");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = () => {
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
            await authService.sendVerificationCode(formData.email);
            setMessage("Код отправлен!");
            setIsCodeSent(true);
        } catch {
            setMessage("Не удалось отправить код.");
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