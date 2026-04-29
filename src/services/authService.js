import api from './api';
import CryptoJS from 'crypto-js';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });

        if (response.data.token) {
            const encryptionKey = CryptoJS.SHA256(password).toString();
            localStorage.setItem('encryption_key', encryptionKey);
        }

        return response;
    },

    register: (userData) => api.post('/api/auth/register', userData),

    // Отправка кода (теперь напрямую через бэкенд)
    sendVerificationCode: (email) => {
        return api.post('/api/auth/send-code', { email });
    },

    // НОВЫЙ МЕТОД: Отправка введенного кода для проверки
    verifyCode: (email, code) => {
        return api.post('/api/auth/verify-code', { email, code });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('encryption_key');
        localStorage.removeItem('userName');
        localStorage.removeItem('isGuest');
    }
};