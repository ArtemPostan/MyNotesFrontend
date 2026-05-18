const QUEUE_KEY = 'pending_sync_queue';

export const syncQueueService = {
    // Получить все задачи из очереди
    getQueue() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
        } catch {
            return [];
        }
    },

    // Добавить задачу в хвост очереди
    addToQueue(type, id, payload = null) {
        const queue = this.getQueue();
        
        // Оптимизация: если мы обновляем то, что уже создано в офлайне, 
        // можно просто обновить payload у существующей задачи CREATE
        if (type === 'UPDATE') {
            const createAction = queue.find(task => task.id === id && task.type === 'CREATE');
            if (createAction) {
                createAction.payload = { ...createAction.payload, ...payload };
                localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
                return;
            }
        }

        queue.push({
            queueId: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type, // 'CREATE' | 'UPDATE' | 'DELETE'
            id,   // tempId для создания или реальный ID для апдейта/удаления
            payload,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    },

    // Удалить конкретную задачу из очереди по её уникальному ключу
    removeFromQueue(queueId) {
        const queue = this.getQueue();
        const filtered = queue.filter(task => task.queueId !== queueId);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    },

    // Очистить всю очередь (например, при логауте)
    clearQueue() {
        localStorage.removeItem(QUEUE_KEY);
    },

    // Главный метод: последовательное выполнение задач (FIFO)
    async processQueueSequence(notesService, onNoteCreatedInServer) {
        const queue = this.getQueue();
        if (queue.length === 0) return false; // Очередь пуста

        // Используем цикл for...of вместо forEach/map! 
        // Он заставит JavaScript дожидаться (await) окончания ПРЕДЫДУЩЕГО запроса перед стартом следующего.
        for (const task of queue) {
            try {
                if (task.type === 'CREATE') {
                    // 1. Отправляем текст на сервер
                    const response = await notesService.create(task.payload.content);
                    const serverNote = response.data;

                    // 2. Вызываем коллбэк, чтобы useNotes заменил tempId на реальный ID в UI и кэше заметок!
                    if (onNoteCreatedInServer) {
                        onNoteCreatedInServer(task.id, serverNote);
                    }
                } 
                else if (task.type === 'UPDATE') {
                    await notesService.update(task.id, task.payload);
                } 
                else if (task.type === 'DELETE') {
                    await notesService.delete(task.id);
                }

                // Если запрос прошел успешно — удаляем ИМЕННО ЭТУ задачу из очереди
                this.removeFromQueue(task.queueId);
            } catch (error) {
                console.error(`Ошибка при синхронизации задачи ${task.type}:`, error);
                
                // Если сервер ответил кодом 4xx (битые данные), эту задачу нет смысла слать вечно — удаляем
                if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 401) {
                    this.removeFromQueue(task.queueId);
                    continue;
                }
                
                // Если сервер упал (5xx) или нет интернета — прерываем цикл. 
                // Остальные задачи подождут следующего раза, порядок не нарушится.
                return false; 
            }
        }
        return true; // Вся очередь успешно слита
    }
};