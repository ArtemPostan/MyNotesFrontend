import { useState, useCallback } from 'react';
import { syncQueueService } from '../services/syncQueueService';

export default function useServerSync() {
    const [isServerAwake, setIsServerAwake] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const executeSync = useCallback(async (apiCall, onSuccess, onError, offlineFallback) => {
        if (!isServerAwake && offlineFallback) {
            offlineFallback();
            return;
        }

        try {
            const response = await apiCall();
            setIsServerAwake(true);
            if (onSuccess) onSuccess(response.data);
            return response.data;
        } catch (error) {
            console.error("Переход в офлайн:", error);
            setIsServerAwake(false);
            
            if (offlineFallback) {
                offlineFallback();
            } else if (onError) {
                onError(error);
            }
        }
    }, [isServerAwake]);

    // Обработка очереди
    const processQueue = useCallback(async (notesService, onNoteCreatedInServer) => {
        // Защита от параллельного запуска процесса синхронизации
        if (isSyncing) return; 

        const queue = syncQueueService.getQueue();
        if (queue.length === 0) {
            setIsServerAwake(true);
            return;
        }

        setIsSyncing(true);
        try {
            // Запускаем нашу строгую последовательную отправку
            const success = await syncQueueService.processQueueSequence(notesService, onNoteCreatedInServer);
            if (success) {
                setIsServerAwake(true);
            }
        } catch (err) {
            console.error("Синхронизация очереди сорвалась:", err);
            setIsServerAwake(false);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    return {
        isServerAwake,
        isSyncing,
        executeSync,
        addToQueue: (...args) => syncQueueService.addToQueue(...args),
        processQueue
    };
}