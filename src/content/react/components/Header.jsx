export function Header({ isDark, onToggleTheme, onClose }) {
    return (
        <div className="selection-popup-header selection-popup-draggable">
            <h3 className="selection-popup-title">Translate & Wiki</h3>
            <div className="selection-popup-header-buttons">
                <button
                    type="button"
                    className="selection-popup-theme-toggle-btn"
                    title="Toggle dark mode"
                    onClick={onToggleTheme}
                >
                    {isDark ? "☀️" : "🌙"}
                </button>
                <button type="button" className="selection-popup-close-btn" onClick={onClose}>
                    &times;
                </button>
            </div>
        </div>
    );
}
