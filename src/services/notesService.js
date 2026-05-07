import api from './api';
import CryptoJS from 'crypto-js';

const getSecretKey = () => localStorage.getItem('encryption_key');

const encrypt = (text) => {
    const key = getSecretKey();
    if (!key || !text) return text;
    return CryptoJS.AES.encrypt(text, key).toString();
};

const decrypt = (cipherText) => {
    const key = localStorage.getItem('encryption_key');
    if (!key || !cipherText) return cipherText;
    if (!cipherText.startsWith('U2FsdGVkX1')) return cipherText;

    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || cipherText;
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

    create: (content) => {
        // Используем локальную функцию encrypt
        const encryptedContent = encrypt(content);
        return api.post('/api/notes', { content: encryptedContent });
    },

    delete: (id) => api.delete(`/api/notes/${id}`),

    update: async (id, data) => {
        try {
            // Если data — это строка, превращаем её в объект
            const payload = typeof data === 'string' ? { content: data } : { ...data };

            if (payload.content) {
                payload.content = encrypt(payload.content);
            }

            return await api.patch(`/api/notes/${id}`, payload);
        } catch (error) {
            console.error("Ошибка при обновлении:", error);
            throw error;
        }
    },

    reorder: async (noteIds) => {
        return await api.patch('/api/notes/reorder', noteIds);
    },

    // Полезно экспортировать функции наружу, если они понадобятся в App.js
    encrypt,
    decrypt
};