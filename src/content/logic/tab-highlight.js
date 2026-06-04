/**
 * Highlight tab.
 */

function handleApplyHighlight() {
    if (!selectedText || selectedText.length === 0) {
        alert("❌ Vui lòng chọn text trước");
        return;
    }

    try {
        chrome.runtime.sendMessage(
            {
                action: "saveHighlight",
                text: selectedText,
                color: selectedHighlightColor,
                pageUrl: window.location.href
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    alert("❌ Lỗi kết nối extension. Hãy reload extension tại chrome://extensions");
                    return;
                }

                if (response?.success) {
                    const applied = highlightTextInPage(selectedText, selectedHighlightColor, response.id);
                    if (applied) {
                        setupHighlightHover(response.id);
                    } else {
                        alert("⚠️ Đã lưu nhưng không tìm thấy text trên trang. Thử bôi đen lại và highlight.");
                    }

                    const applyBtn = popupContainer?.querySelector(".selection-popup-highlight-apply-btn");
                    if (applyBtn) {
                        const originalText = applyBtn.textContent;
                        applyBtn.textContent = "✅ Đã highlight!";
                        applyBtn.disabled = true;
                        setTimeout(() => {
                            if (popupContainer) {
                                applyBtn.textContent = originalText;
                                applyBtn.disabled = false;
                            }
                        }, 2000);
                    }
                } else {
                    alert(`❌ Lỗi highlight: ${response?.error || "Vui lòng thử lại"}`);
                }
            }
        );
    } catch (error) {
        console.error("Error applying highlight:", error);
        alert("❌ Có lỗi xảy ra");
    }
}
