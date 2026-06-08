import { forwardRef } from "react";

export const Popup = forwardRef(function Popup(
    { isDark, position, selectedText, children, header, tabs },
    ref
) {
    return (
        <div
            ref={ref}
            className={`selection-popup-container${isDark ? " dark" : ""}`}
            style={{ left: `${position.left}px`, top: `${position.top}px` }}
        >
            {header}
            {tabs}
            <div className="selection-popup-content">
                <div className="selection-popup-selected-text">
                    {selectedText ?? ""}
                </div>
                {children}
            </div>
        </div>
    );
});