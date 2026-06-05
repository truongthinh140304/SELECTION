import { useEffect, useState } from "react";
import { sendChromeMessage } from "../hooks/useChromeMessage.js";
import { ErrorMessage, Loading, SafeHtml } from "./shared.jsx";

export function WikiTab({ isActive, selectedText, translationData, onTranslationUpdate }) {
    const [phase, setPhase] = useState("idle");
    const [wiki, setWiki] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!isActive) return;

        let cancelled = false;

        const load = async () => {
            setPhase("loading");
            setWiki(null);
            setErrorMessage("");

            const response = await sendChromeMessage({ action: "searchWikipedia", text: selectedText });

            if (cancelled) return;

            if (response?.success) {
                const description = response.description || "";
                const excerpt =
                    description.length > 300 ? `${description.substring(0, 300)}...` : description;

                setWiki({
                    title: response.title,
                    excerpt,
                    url: response.url
                });
                setPhase("result");
                onTranslationUpdate({
                    translatedText: translationData?.translatedText || "",
                    wikipediaInfo: {
                        title: response.title,
                        description: response.description,
                        url: response.url,
                        language: response.language
                    }
                });
            } else {
                setErrorMessage(response?.error || "Không nhận được phản hồi từ extension");
                setPhase("error");
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isActive, selectedText]);

    if (!isActive) {
        return (
            <div className="selection-popup-tab-pane" data-pane="wiki">
                <Loading>Đang tìm kiếm...</Loading>
            </div>
        );
    }

    return (
        <div className="selection-popup-tab-pane active" data-pane="wiki">
            {phase === "loading" && <Loading>Đang tìm kiếm...</Loading>}
            {phase === "result" && wiki && (
                <div className="selection-popup-result">
                    <SafeHtml className="selection-popup-result-title" text={wiki.title} />
                    <SafeHtml className="selection-popup-result-description" text={wiki.excerpt} />
                    <a
                        href={wiki.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="selection-popup-result-link"
                    >
                        📖 Đọc thêm trên Wikipedia →
                    </a>
                </div>
            )}
            {phase === "error" && <ErrorMessage message={errorMessage} />}
        </div>
    );
}
