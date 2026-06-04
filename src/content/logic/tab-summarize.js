/**
 * Summarize tab.
 */

function switchSummarizeTab(subTabName) {
    if (!popupContainer) return;

    popupContainer.querySelectorAll(".selection-popup-summarize-tab-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.summarizeTab === subTabName) {
            btn.classList.add("active");
        }
    });

    popupContainer.querySelectorAll(".selection-popup-summarize-pane").forEach((pane) => pane.classList.remove("active"));
    const activePane = popupContainer.querySelector(`[data-summarize-pane="${subTabName}"]`);
    if (activePane) {
        activePane.classList.add("active");
    }

    if (subTabName === "selection") {
        loadSummarizeSelection();
    } else if (subTabName === "fullpage") {
        loadSummarizeFullPage();
    }
}

function loadSummarizeSelection() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-summarize-pane="selection"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang tóm tắt...
    </div>
  `;

    chrome.runtime.sendMessage(
        { action: "summarizeSelection", text: selectedText },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            if (!popupContainer) return;

            if (response?.success) {
                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-description">${escapeHtml(response.summary)}</div>
          </div>
        `;
            } else {
                pane.innerHTML = `
          <div class="selection-popup-error">
            ❌ ${escapeHtml(response?.error || "Không thể tóm tắt đoạn văn")}
          </div>
        `;
            }
        }
    );
}

function loadSummarizeFullPage() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-summarize-pane="fullpage"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang tóm tắt trang...
    </div>
  `;

    const pageText = document.body.innerText;

    chrome.runtime.sendMessage(
        { action: "summarizeFullPage", text: pageText },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            if (!popupContainer) return;

            if (response?.success) {
                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-description">${escapeHtml(response.summary)}</div>
          </div>
        `;
            } else {
                pane.innerHTML = `
          <div class="selection-popup-error">
            ❌ ${escapeHtml(response?.error || "Không thể tóm tắt trang")}
          </div>
        `;
            }
        }
    );
}
