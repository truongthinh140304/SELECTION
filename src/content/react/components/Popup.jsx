import { forwardRef } from "react";
import { escapeHtml } from "../utils/escapeHtml.js";

export const Popup = forwardRef(function Popup(
    { isDark, position, selectedText, children, header, tabs },
    ref
) {
    const safeText = escapeHtml(selectedText ?? "");

    return (
        <div
            ref={ref}
            className={`selection-popup-container${isDark ? " dark" : ""}`}
            style={{ left: `${position.left}px`, top: `${position.top}px` }}
        >
            {header}
            {tabs}
            <div className="selection-popup-content">
                <div
                    className="selection-popup-selected-text"
                    dangerouslySetInnerHTML={{ __html: safeText }}
                />
                {children}
            </div>
        </div>
    );
});
