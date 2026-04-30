import api from './api';
import CryptoJS from 'crypto-js';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });

        if (response.data.token && response.data.encryptionKey) {          
            localStorage.setItem('encryption_key', response.data.encryptionKey);
        }

        return response;
    },

    register: (userData) => api.post('/api/auth/register', userData),

    sendVerificationCode: (email) => {
        return api.post('/api/auth/send-code', { email });
    },

    verifyCode: (email, code) => {
        return api.post('/api/auth/verify-code', { email, code });
    },

    async verifyResetCode(email, code) {
        return api.post('/api/auth/verify-reset-code', { email, code });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('encryption_key');
        localStorage.removeItem('userName');
        localStorage.removeItem('isGuest');
    },

    async resetPasswordRequest(email) {
        return api.post('/api/auth/reset-password-request', { email });
    },

    async resetPasswordConfirm(email, code, newPassword) {
        return api.post('/api/auth/reset-password-confirm', { email, code, newPassword });
    },

};