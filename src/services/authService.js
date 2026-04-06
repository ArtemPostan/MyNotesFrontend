import api from './api';

export const authService = {
    login: (email, password) => api.post('/api/auth/login', { email, password }),
    register: (userData) => api.post('/api/auth/register', userData),
    logout: () => {
        localStorage.removeItem('token');
    }
};