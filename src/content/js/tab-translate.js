/**
 * Translate tab.
 */

function showTranslateButton() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-pane="translate"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-button-container">
      <button class="selection-popup-translate-btn">
        <span>🌐</span> Dịch
      </button>
    </div>
  `;

    const translateBtn = pane.querySelector(".selection-popup-translate-btn");
    if (translateBtn) {
        translateBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            performTranslation();
        });
    }
}

function performTranslation() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-pane="translate"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang dịch...
    </div>
  `;

    chrome.runtime.sendMessage(
        { action: "translate", text: selectedText },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            if (!popupContainer) return;

            if (response?.success) {
                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-description">${escapeHtml(response.translatedText)}</div>
          </div>
        `;
                currentTranslationData = {
                    translatedText: response.translatedText,
                    wikipediaInfo: null
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
