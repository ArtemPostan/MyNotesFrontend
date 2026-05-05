import api from './api';
import CryptoJS from 'crypto-js';

// Хелпер для получения ключа
const getSecretKey = () => localStorage.getItem('encryption_key');

const encrypt = (text) => {
    const key = getSecretKey();
    if (!key || !text) return text;
    return CryptoJS.AES.encrypt(text, key).toString();
};

const decrypt = (cipherText) => {
    // Явно берем актуальное значение прямо из хранилища в момент вызова
    const key = localStorage.getItem('encryption_key');

    if (!key || !cipherText) return cipherText;

    // Если это не шифр, возвращаем как есть
    if (!cipherText.startsWith('U2FsdGVkX1')) return cipherText;

    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || cipherText; // Если не расшифровалось, не портим текст
    } catch {
        return cipherText;
    }
};

export const notesService = {
    getAll: async () => {
        const response = await api.get('/api/notes');
        const decryptedData = Array.isArray(response.data)
            ? response.data.map(note => ({
                ...note,
                content: decrypt(note.content)
            }))
            : [];
        return { ...response, data: decryptedData };
    },

    // Шифруем перед отправкой
    create: (content) => {
        const encryptedContent = encrypt(content);
        return api.post('/api/notes', { content: encryptedContent });
    },

    delete: (id) => api.delete(`/api/notes/${id}`),

    update: async (id, content) => {
        const encryptedContent = encrypt(content);
        return await api.patch(`/api/notes/${id}`, { content: encryptedContent });
    },

    reorder: async (noteIds) => {
        // Отправляем массив строк (ID) в правильном порядке
        return await api.patch('/api/notes/reorder', noteIds);
    }
};