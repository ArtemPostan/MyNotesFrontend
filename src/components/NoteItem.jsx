import { useState } from 'react';
import base from '../styles/NoteItem/BaseNote.module.css';
import { useNoteEditor } from '../hooks/useNoteEditor';
import NoteContent from './NoteContent';
import NoteFooter from './NoteFooter';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function NoteItem({ note, onDelete, onUpdate, onToggleCollapse, isUpdating }) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Подключаем наш новый "движок" редактора
    const editorTools = useNoteEditor(note, onUpdate);

    // Функционал dnd-kit (перетаскивание)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: note.id, disabled: isSettingsOpen });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Управляем z-index, чтобы активная заметка была поверх остальных
        zIndex: isSettingsOpen ? 5000 : (isDragging ? 100 : 1),
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${base.noteItem} ${isSettingsOpen ? base.activeNote : ''} ${note.isCollapsed ? base.collapsed : ''}`}
        >
            {/* 1. Ручка для перетаскивания */}
            <div
                className={base.dragHandle}
                {...attributes}
                {...listeners}
                title="Зажмите, чтобы переместить"
            >
                <span className={base.dragIcon}>⠿</span>
            </div>

            {/* 2. Основной контент (Редактор / Список) */}
            <NoteContent 
                note={note} 
                {...editorTools} 
            />

            {/* 3. Нижняя часть (Дата, кнопки управления, модалка) */}
            <NoteFooter 
                note={note} 
                isUpdating={isUpdating}
                onDelete={onDelete}
                onToggleCollapse={onToggleCollapse}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                onUpdate={onUpdate}
                // Передаем текущий текст из редактора для корректного сохранения из модалки
                currentText={editorTools.localText}
            />
        </div>
    );
}

export default NoteItem;