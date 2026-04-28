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
    const key = getSecretKey();
    if (!key || !cipherText) return cipherText;
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || " [Ошибка расшифровки: возможно, сменился ключ] ";
    } catch {
        return " [Заметка зашифрована] ";
    }
};

export const notesService = {
    // Получаем все и сразу расшифровываем
    getAll: async () => {
        const response = await api.get('/api/notes');
        if (Array.isArray(response.data)) {
            response.data = response.data.map(note => ({
                ...note,
                content: decrypt(note.content)
            }));
        }
        return response;
    },

    // Шифруем перед отправкой
    create: (content) => {
        const encryptedContent = encrypt(content);
        return api.post('/api/notes', { content: encryptedContent });
    },

    delete: (id) => api.delete(`/api/notes/${id}`),

    // Шифруем при обновлении
    update: async (id, content) => {
        const encryptedContent = encrypt(content);
        const response = await api.patch(`/api/notes/${id}`, { content: encryptedContent });
        
        // Возвращаем ответ, расшифровав контент обратно (для синхронизации UI)
        if (response.data && response.data.content) {
            response.data.content = decrypt(response.data.content);
        }
        return response;
    }
};