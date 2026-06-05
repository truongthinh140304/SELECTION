import { useEffect, useState } from "react";
import { sendChromeMessage } from "../hooks/useChromeMessage.js";
import { ErrorMessage, Loading, SafeHtml } from "./shared.jsx";

export function TranslateTab({ isActive, selectedText, onTranslationUpdate }) {
    const [phase, setPhase] = useState("idle");
    const [translatedText, setTranslatedText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isActive) {
            setPhase("idle");
            setTranslatedText("");
            setErrorMessage("");
        }
    }, [isActive]);

    const performTranslation = async (e) => {
        e?.stopPropagation();
        e?.preventDefault();
        setPhase("loading");

        const response = await sendChromeMessage({ action: "translate", text: selectedText });

        if (response?.success) {
            setTranslatedText(response.translatedText);
            setPhase("result");
            onTranslationUpdate({
                translatedText: response.translatedText,
                wikipediaInfo: null
            });
        } else {
            setErrorMessage(response?.error || "Không nhận được phản hồi từ extension");
            setPhase("error");
        }
    };

    if (!isActive) {
        return <div className="selection-popup-tab-pane" data-pane="translate"></div>;
    }

    return (
        <div className="selection-popup-tab-pane active" data-pane="translate">
            {phase === "idle" && (
                <div className="selection-popup-button-container">
                    <button type="button" className="selection-popup-translate-btn" onClick={performTranslation}>
                        <span>🌐</span> Dịch
                    </button>
                </div>
            )}
            {phase === "loading" && <Loading>Đang dịch...</Loading>}
            {phase === "result" && (
                <div className="selection-popup-result">
                    <SafeHtml className="selection-popup-result-description" text={translatedText} />
                </div>
            )}
            {phase === "error" && <ErrorMessage message={errorMessage} />}
        </div>
    );
}
