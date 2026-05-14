import s from '../styles/NoteItem/NoteEditor.module.css';

const NoteChecklist = ({ lines, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className={s.checkboxStrip}>
            {lines.map((_, index) => (
                <div key={index} className={s.checkboxCell}>
                    {/* Чекбокс рисуем для каждой строки, кроме первой (если такова логика) */}
                    {index > 0 && (
                        <input 
                            type="checkbox" 
                            className={s.realCheckbox} 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default NoteChecklist;