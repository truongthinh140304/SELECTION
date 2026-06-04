/**
 * Wikipedia tab.
 */

function loadWikiContent() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-pane="wiki"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang tìm kiếm...
    </div>
  `;

    chrome.runtime.sendMessage(
        { action: "searchWikipedia", text: selectedText },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            if (!popupContainer) return;

            if (response?.success) {
                const description = response.description || "";
                const excerpt = description.length > 300 ? `${description.substring(0, 300)}...` : description;

                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-title">${escapeHtml(response.title)}</div>
            <div class="selection-popup-result-description">${escapeHtml(excerpt)}</div>
            <a href="${response.url}" target="_blank" class="selection-popup-result-link">
              📖 Đọc thêm trên Wikipedia →
            </a>
          </div>
        `;

                currentTranslationData = {
                    translatedText: currentTranslationData?.translatedText || "",
                    wikipediaInfo: {
                        title: response.title,
                        description: response.description,
                        url: response.url,
                        language: response.language
                    }
                };
            } else {
                pane.innerHTML = `
          <div class="selection-popup-error">
            ❌ ${escapeHtml(response?.error || "Không nhận được phản hồi từ extension")}
          </div>
        `;
            }
        }
    );
}
