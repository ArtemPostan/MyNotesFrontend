import api from './api';
import CryptoJS from 'crypto-js';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        
        // Ключ сохраняем только если сервер вернул токен (вход разрешен)
        // Если почта не подтверждена, сервер все равно может прислать данные пользователя 
        // для отображения в VerifyPrompt, но токен — это решающий фактор.
        if (response.data.token) {
            const encryptionKey = CryptoJS.SHA256(password).toString();
            localStorage.setItem('encryption_key', encryptionKey);
        }
        
        return response;
    },

    register: (userData) => api.post('/api/auth/register', userData),

    // НОВЫЙ МЕТОД: для отправки кода через Kafka
    sendVerificationCode: (email) => {
        return api.post('/api/auth/send-code', { email });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('encryption_key');
        localStorage.removeItem('userName');
        localStorage.removeItem('isGuest'); // Добавил очистку флага гостя
    }
};