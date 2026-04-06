import api from './api';

export const notesService = {
    getAll: () => api.get('/api/notes'),
    create: (content) => api.post('/api/notes', { content }),
    delete: (id) => api.delete(`/api/notes/${id}`) // когда добавишь удаление
};