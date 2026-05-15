const NOTES_KEY = 'mynotes_cache';

export const storageService = {
    // Сохранить список заметок
    saveNotes: (notes) => {
        try {
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error("Ошибка сохранения в кэш", e);
        }        
    },

    // Получить заметки из кэша
    getNotes: () => {
        const data = localStorage.getItem(NOTES_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Очистить кэш (например, при логауте)
    clear: () => {
        localStorage.removeItem(NOTES_KEY);
    }
};