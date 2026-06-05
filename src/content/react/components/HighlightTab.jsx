import { useState } from "react";
import { sendChromeMessage } from "../hooks/useChromeMessage.js";

const HIGHLIGHT_COLORS = [
    { color: "#FFFF00", title: "Vàng" },
    { color: "#FF6B6B", title: "Đỏ" },
    { color: "#4ECDC4", title: "Xanh nhạt" },
    { color: "#95E1D3", title: "Xanh lá" },
    { color: "#FFB6D9", title: "Hồng" },
    { color: "#C7CEEA", title: "Tím" }
];

export function HighlightTab({ isActive, selectedText }) {
    const [selectedColor, setSelectedColor] = useState("#FFFF00");
    const [applyState, setApplyState] = useState("idle");

    const handleApplyHighlight = async () => {
        if (!selectedText || selectedText.length === 0) {
            alert("❌ Vui lòng chọn text trước");
            return;
        }

        try {
            const response = await sendChromeMessage({
                action: "saveHighlight",
                text: selectedText,
                color: selectedColor,
                pageUrl: window.location.href
            });

            if (response?.connectionFailed) {
                alert("❌ Lỗi kết nối extension. Hãy reload extension tại chrome://extensions");
                return;
            }

            if (!response?.success) {
                alert(`❌ Lỗi highlight: ${response?.error || "Vui lòng thử lại"}`);
                return;
            }

            const highlightFn = globalThis.highlightTextInPage;
            const hoverFn = globalThis.setupHighlightHover;

            if (typeof highlightFn === "function") {
                const applied = highlightFn(selectedText, selectedColor, response.id);
                if (applied && typeof hoverFn === "function") {
                    hoverFn(response.id);
                } else if (!applied) {
                    alert("⚠️ Đã lưu nhưng không tìm thấy text trên trang. Thử bôi đen lại và highlight.");
                }
            }

            setApplyState("success");
            setTimeout(() => setApplyState("idle"), 2000);
        } catch (error) {
            console.error("Error applying highlight:", error);
            alert("❌ Có lỗi xảy ra");
        }
    };

    if (!isActive) {
        return <div className="selection-popup-tab-pane" data-pane="highlight"></div>;
    }

    return (
        <div className="selection-popup-tab-pane active" data-pane="highlight">
            <div className="selection-popup-highlight-content">
                <p className="selection-popup-highlight-label">Chọn màu highlight:</p>
                <div className="selection-popup-color-picker">
                    {HIGHLIGHT_COLORS.map(({ color, title }) => (
                        <button
                            key={color}
                            type="button"
                            className={`selection-popup-color-btn${selectedColor === color ? " active" : ""}`}
                            data-color={color}
                            title={title}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    className="selection-popup-highlight-apply-btn"
                    onClick={handleApplyHighlight}
                    disabled={applyState === "success"}
                >
                    {applyState === "success" ? "✅ Đã highlight!" : "Highlight text này"}
                </button>
                <p className="selection-popup-highlight-hint">Tip: Di chuột vào highlight để xóa</p>
            </div>
        </div>
    );
}
