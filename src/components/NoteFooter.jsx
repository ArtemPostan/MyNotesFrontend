import React from 'react';
import base from '../styles/NoteItem/BaseNote.module.css';
import controls from '../styles/NoteItem/NoteControls.module.css';
import SettingsModal from './SettingsModal';

const NoteFooter = ({
    note,
    isUpdating,
    onDelete,
    onToggleCollapse,
    onOpenSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    onUpdate,
    currentText
}) => {

    // --- Логика форматирования даты ---
    const isEdited = note.updatedAt && note.updatedAt !== note.createdAt;
    const displayDate = isEdited ? note.updatedAt : note.createdAt;
    const label = isEdited ? "Обновлено " : "";

    const formatDate = (dateData) => {
        if (!dateData) return "Дата неизвестна";
        try {
            let d;
            if (Array.isArray(dateData)) {
                d = new Date(dateData[0], dateData[1] - 1, dateData[2], dateData[3] || 0, dateData[4] || 0);
            } else {
                d = new Date(dateData);
            }
            return d.toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return "Ошибка даты"; }
    };

    const formattedDate = formatDate(displayDate);

    return (
        <div className={base.noteFooter}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    className={controls.collapseBtn}
                    onClick={() => onToggleCollapse(note.id)}
                    title={note.isCollapsed ? "Развернуть" : "Свернуть"}
                >
                    {note.isCollapsed ? '▼' : '▲'}
                </button>

                <span className={base.noteDate}>
                    {label}{formattedDate}
                </span>
                {isUpdating && <div className={controls.miniLoader}></div>}
            </div>

            <div className={base.footerActions}>
                <button
                    className={controls.deleteBtn}
                    onClick={() => onDelete(note.id)}
                    disabled={isUpdating}
                >
                    ✕
                </button>
                <button
                    className={controls.settingsBtn}
                    onClick={onOpenSettings}
                    title="Настройки"
                >
                    ⚙️
                </button>
            </div>

            <SettingsModal
                show={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isCompleted={note.isCompleted}
                // Используем currentText (тот, что сейчас в редакторе), 
                // чтобы при смене режима в модалке не потерять несохраненные правки
                onToggleTodo={() => {
                    let processedText = currentText;

                    // Если мы СЕЙЧАС в режиме чекбоксов и ХОТИМ его выключить
                    if (note.isCompleted) {
                        // Убираем все [x] и [ ] в начале строк при сохранении
                        processedText = currentText
                            .split('\n')
                            .map(line => line.replace(/^\[[x ]\] /, ''))
                            .join('\n');
                    } else {
                        // Если мы ВКЛЮЧАЕМ режим чекбоксов, 
                        // добавим пустые скобки тем строкам, где их нет
                        processedText = currentText
                            .split('\n')
                            .map(line => line.startsWith('[x] ') || line.startsWith('[ ] ') ? line : `[ ] ${line}`)
                            .join('\n');
                    }

                    onUpdate(note.id, processedText, !note.isCompleted);
                }}
            />
        </div>
    );
};

export default NoteFooter;