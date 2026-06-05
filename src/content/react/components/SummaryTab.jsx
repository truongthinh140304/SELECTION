import { useEffect, useState } from "react";
import { sendChromeMessage } from "../hooks/useChromeMessage.js";
import { ErrorMessage, Loading, SafeHtml } from "./shared.jsx";

export function SummaryTab({ isActive, selectedText }) {
    const [subTab, setSubTab] = useState("selection");
    const [selectionPhase, setSelectionPhase] = useState("idle");
    const [selectionSummary, setSelectionSummary] = useState("");
    const [selectionError, setSelectionError] = useState("");
    const [fullpagePhase, setFullpagePhase] = useState("idle");
    const [fullpageSummary, setFullpageSummary] = useState("");
    const [fullpageError, setFullpageError] = useState("");

    useEffect(() => {
        if (!isActive) return;
        setSubTab("selection");
    }, [isActive]);

    useEffect(() => {
        if (!isActive || subTab !== "selection") return;

        let cancelled = false;

        const load = async () => {
            setSelectionPhase("loading");
            setSelectionSummary("");
            setSelectionError("");

            const response = await sendChromeMessage({
                action: "summarizeSelection",
                text: selectedText
            });

            if (cancelled) return;

            if (response?.success) {
                setSelectionSummary(response.summary);
                setSelectionPhase("result");
            } else {
                setSelectionError(response?.error || "Không thể tóm tắt đoạn văn");
                setSelectionPhase("error");
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isActive, subTab, selectedText]);

    useEffect(() => {
        if (!isActive || subTab !== "fullpage") return;

        let cancelled = false;

        const load = async () => {
            setFullpagePhase("loading");
            setFullpageSummary("");
            setFullpageError("");

            const pageText = document.body.innerText;
            const response = await sendChromeMessage({
                action: "summarizeFullPage",
                text: pageText
            });

            if (cancelled) return;

            if (response?.success) {
                setFullpageSummary(response.summary);
                setFullpagePhase("result");
            } else {
                setFullpageError(response?.error || "Không thể tóm tắt trang");
                setFullpagePhase("error");
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isActive, subTab]);

    if (!isActive) {
        return <div className="selection-popup-tab-pane" data-pane="summarize"></div>;
    }

    return (
        <div className="selection-popup-tab-pane active" data-pane="summarize">
            <div className="selection-popup-summarize-tabs">
                <button
                    type="button"
                    className={`selection-popup-summarize-tab-btn${subTab === "selection" ? " active" : ""}`}
                    data-summarize-tab="selection"
                    onClick={() => setSubTab("selection")}
                >
                    Tóm tắt đoạn
                </button>
                <button
                    type="button"
                    className={`selection-popup-summarize-tab-btn${subTab === "fullpage" ? " active" : ""}`}
                    data-summarize-tab="fullpage"
                    onClick={() => setSubTab("fullpage")}
                >
                    Tóm tắt tất cả
                </button>
            </div>

            <div
                className={`selection-popup-summarize-pane${subTab === "selection" ? " active" : ""}`}
                data-summarize-pane="selection"
            >
                {selectionPhase === "loading" && <Loading>Đang tóm tắt...</Loading>}
                {selectionPhase === "result" && (
                    <div className="selection-popup-result">
                        <SafeHtml className="selection-popup-result-description" text={selectionSummary} />
                    </div>
                )}
                {selectionPhase === "error" && <ErrorMessage message={selectionError} />}
            </div>

            <div
                className={`selection-popup-summarize-pane${subTab === "fullpage" ? " active" : ""}`}
                data-summarize-pane="fullpage"
            >
                {fullpagePhase === "loading" && <Loading>Đang tóm tắt trang...</Loading>}
                {fullpagePhase === "result" && (
                    <div className="selection-popup-result">
                        <SafeHtml className="selection-popup-result-description" text={fullpageSummary} />
                    </div>
                )}
                {fullpagePhase === "error" && <ErrorMessage message={fullpageError} />}
            </div>
        </div>
    );
}
