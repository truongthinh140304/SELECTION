import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { useSelection } from "./hooks/useSelection.js";
import "./styles.css";

function SelectionIcon({ left, top, onOpen }) {
    return (
        <button
            type="button"
            className="selection-popup-icon"
            style={{ left: `${left}px`, top: `${top}px` }}
            title="Dịch & Wiki"
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpen();
            }}
        >
            TW
        </button>
    );
}

function ExtensionRoot() {
    const { selectedText, iconPosition, popupOpen, openPopup, closePopup } = useSelection();

    return (
        <>
            {iconPosition && !popupOpen && (
                <SelectionIcon left={iconPosition.left} top={iconPosition.top} onOpen={openPopup} />
            )}
            {popupOpen && selectedText && <App selectedText={selectedText} onClose={closePopup} />}
        </>
    );
}

const host = document.createElement("div");
host.id = "selection-translate-wiki-react-root";
document.body.appendChild(host);

createRoot(host).render(<ExtensionRoot />);
