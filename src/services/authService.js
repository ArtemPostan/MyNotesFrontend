import api from './api';
import CryptoJS from 'crypto-js';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        
        if (response.data.token) {
            // Создаем ключ шифрования на основе пароля
            // Мы используем SHA-256, чтобы получить стабильную строку из пароля
            const encryptionKey = CryptoJS.SHA256(password).toString();
            localStorage.setItem('encryption_key', encryptionKey);
        }
        
        return response;
    },

    register: (userData) => api.post('/api/auth/register', userData),

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('encryption_key'); // Очищаем ключ при выходе
        localStorage.removeItem('userName');
    }
};