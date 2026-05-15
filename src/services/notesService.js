import api from './api';

// Мы больше не импортируем CryptoJS здесь, так как бэкенд расшифровывает данные сам.
// Но если функции encrypt/decrypt используются где-то еще, 
// мы оставим их "заглушками", чтобы приложение не упало.

export const notesService = {
    getAll: async () => {
        const response = await api.get('/api/notes');
        // Бэкенд теперь присылает уже расшифрованный контент.
        // Нам достаточно просто проверить, что это массив.
        const data = Array.isArray(response.data) ? response.data : [];
        return { ...response, data };
    },

    create: (content) => {
        // Отправляем чистый текст, бэкенд зашифрует его перед сохранением в БД.
        return api.post('/api/notes', { content });
    },

    delete: (id) => api.delete(`/api/notes/${id}`),

    update: async (id, data) => {
        try {
            // Если data — это строка, превращаем её в объект
            const payload = typeof data === 'string' ? { content: data } : { ...data };

            // Мы больше не вызываем encrypt(payload.content) здесь.
            // Просто отправляем данные как есть.
            return await api.patch(`/api/notes/${id}`, payload);
        } catch (error) {
            console.error("Ошибка при обновлении:", error);
            throw error;
        }
    },

    reorder: async (noteIds) => {
        return await api.patch('/api/notes/reorder', noteIds);
    },

    // Заглушки для совместимости, если они импортируются в других частях приложения.
    // Теперь они просто возвращают текст без изменений.
    encrypt: (text) => text,
    decrypt: (text) => text
};