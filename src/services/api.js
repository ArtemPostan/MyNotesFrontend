import axios from 'axios';

const api = axios.create({
    baseURL: "https://bbac22ncehpq498kutp5.containers.yandexcloud.net"
});

// const api = axios.create({ 
//     baseURL: 'http://localhost:8080' 
// });

// Перехватчик: перед КАЖДЫМ запросом добавляет токен из localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['X-Auth-Token'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;