import React, { useEffect } from 'react';
import editor from '../styles/NoteItem/NoteEditor.module.css';

const NoteContent = ({ note, localText, handleTextChange, handleKeyDown, toggleTodoLine, inputRefs, textareaRef, adjustHeight }) => {
    
    const lines = localText.split('\n');

    useEffect(() => {
        if (!note.isCompleted && textareaRef.current) {
            adjustHeight(textareaRef.current);
        } else if (note.isCompleted && inputRefs.current) {
            inputRefs.current.forEach(el => {
                if (el) adjustHeight(el);
            });
        }
    }, [note.isCompleted, note.isCollapsed, localText, adjustHeight, textareaRef, inputRefs]);

    // 1. Режим обычной заметки (без изменений)
    if (!note.isCompleted) {
        return (
            <div className={editor.container}>
                <textarea
                    ref={textareaRef}
                    className={`${editor.textarea} ${note.isCollapsed ? editor.collapsed : ''}`}
                    value={localText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    spellCheck="false"
                    rows="1"
                    readOnly={note.isCollapsed}
                />
            </div>
        );
    }

    // 2. Режим списка дел
    return (
        <div className={`${editor.todoList} ${note.isCollapsed ? editor.collapsedTodo : ''}`}>
            {lines.map((line, index) => {
                const isChecked = line.startsWith('[x] ');
                const cleanText = line.replace(/^\[[x ]\] /, '');

                // ПЕРВАЯ СТРОКА: Рендерим без чекбокса (как заголовок)
                if (index === 0) {
                    return (
                        <div key={index} className={editor.headerRow} style={{ marginBottom: '8px' }}>
                            <textarea
                                ref={el => (inputRefs.current[index] = el)}
                                className={editor.textarea}
                                style={{ fontWeight: 'bold', fontSize: '1.1em' }} // Выделяем визуально
                                value={cleanText}
                                rows="1"
                                spellCheck="false"
                                placeholder="Заголовок списка..."
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                readOnly={note.isCollapsed}
                                onChange={(e) => {
                                    const newLines = [...lines];
                                    // У заголовка нет префикса [ ]
                                    newLines[index] = e.target.value;
                                    handleTextChange(newLines.join('\n'));
                                }}
                                onInput={(e) => adjustHeight(e.target)}
                            />
                        </div>
                    );
                }

                // ОСТАЛЬНЫЕ СТРОКИ: С чекбоксами
                return (
                    <div key={index} className={editor.todoRow}>
                        <div className={editor.checkboxCell}>
                            <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => toggleTodoLine(index)}
                                className={editor.realCheckbox}
                                disabled={note.isCollapsed}
                            />
                        </div>
                        <textarea
                            ref={el => (inputRefs.current[index] = el)}
                            className={`${editor.textarea} ${isChecked ? editor.completedText : ''}`}
                            value={cleanText}
                            rows="1"
                            spellCheck="false"
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            readOnly={note.isCollapsed}
                            onChange={(e) => {
                                const newLines = [...lines];
                                const prefix = isChecked ? '[x] ' : '[ ] ';
                                newLines[index] = prefix + e.target.value;
                                handleTextChange(newLines.join('\n'));
                            }}
                            onInput={(e) => adjustHeight(e.target)}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default NoteContent;