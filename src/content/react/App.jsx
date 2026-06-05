import { useCallback, useRef, useState } from "react";
import { Header } from "./components/Header.jsx";
import { HighlightTab } from "./components/HighlightTab.jsx";
import { Popup } from "./components/Popup.jsx";
import { StorageTab } from "./components/StorageTab.jsx";
import { SummaryTab } from "./components/SummaryTab.jsx";
import { Tabs } from "./components/Tabs.jsx";
import { TranslateTab } from "./components/TranslateTab.jsx";
import { WikiTab } from "./components/WikiTab.jsx";
import { getInitialPopupPosition, useDraggable } from "./hooks/useDraggable.js";

export default function App({ selectedText, onClose }) {
    const [activeTab, setActiveTab] = useState("translate");
    const [isDark, setIsDark] = useState(false);
    const [position, setPosition] = useState(getInitialPopupPosition);
    const [translationData, setTranslationData] = useState({
        translatedText: "",
        wikipediaInfo: null
    });

    const containerRef = useRef(null);
    useDraggable(containerRef, position, setPosition);

    const handleTranslationUpdate = useCallback((data) => {
        setTranslationData(data);
    }, []);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => !prev);
    }, []);

    return (
        <Popup
            ref={containerRef}
            isDark={isDark}
            position={position}
            selectedText={selectedText}
            header={<Header isDark={isDark} onToggleTheme={toggleTheme} onClose={onClose} />}
            tabs={<Tabs activeTab={activeTab} onTabChange={handleTabChange} />}
        >
            <TranslateTab
                isActive={activeTab === "translate"}
                selectedText={selectedText}
                onTranslationUpdate={handleTranslationUpdate}
            />
            <WikiTab
                isActive={activeTab === "wiki"}
                selectedText={selectedText}
                translationData={translationData}
                onTranslationUpdate={handleTranslationUpdate}
            />
            <SummaryTab isActive={activeTab === "summarize"} selectedText={selectedText} />
            <StorageTab
                isActive={activeTab === "storage"}
                selectedText={selectedText}
                translationData={translationData}
            />
            <HighlightTab isActive={activeTab === "highlight"} selectedText={selectedText} />
        </Popup>
    );
}
