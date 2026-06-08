export function Loading({ children }) {
    return (
        <div className="selection-popup-loading">
            <span className="selection-popup-spinner"></span>
            {children}
        </div>
    );
}

export function ErrorMessage({ message }) {
    return <div className="selection-popup-error">❌ {message}</div>;
}

export function SafeHtml({ text, className }) {
    return <div className={className}>{text ?? ""}</div>;
}