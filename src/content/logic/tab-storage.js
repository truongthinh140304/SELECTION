/**
 * Storage tab.
 */

function switchStorageTab(subTabName) {
    if (!popupContainer) return;

    popupContainer.querySelectorAll(".selection-popup-storage-tab-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.storageTab === subTabName) {
            btn.classList.add("active");
        }
    });

    popupContainer.querySelectorAll(".selection-popup-storage-pane").forEach((pane) => pane.classList.remove("active"));
    const activePane = popupContainer.querySelector(`[data-storage-pane="${subTabName}"]`);
    if (activePane) {
        activePane.classList.add("active");
    }

    if (subTabName === "archive") {
        loadStorageArchive();
    } else if (subTabName === "url-archive") {
        loadUrlStorageArchive();
    }
}

function loadStorageArchive() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-storage-pane="archive"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang tải...
    </div>
  `;

    chrome.runtime.sendMessage({ action: "getArchiveItems" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
        if (!popupContainer) return;

        if (response?.success && Array.isArray(response.items)) {
            const items = response.items;
            if (items.length === 0) {
                pane.innerHTML = `<div class="selection-popup-archive-empty">Kho lưu trữ trống rỗng</div>`;
                return;
            }

            let archiveHtml = '<div class="selection-popup-archive-list">';
            items.forEach((item) => {
                const savedDate = new Date(item.savedAt).toLocaleString("vi-VN");
                archiveHtml += `
            <div class="selection-popup-archive-item" data-item-id="${escapeHtml(item.id)}">
              <div class="selection-popup-archive-item-text">${escapeHtml(item.text)}</div>
              <div class="selection-popup-archive-item-translation">${escapeHtml(item.translatedText)}</div>
              <div class="selection-popup-archive-item-meta">
                <span class="selection-popup-archive-item-date">${escapeHtml(savedDate)}</span>
                <button class="selection-popup-archive-delete-btn" data-item-id="${escapeHtml(item.id)}">❌ Xóa</button>
              </div>
            </div>
          `;
            });
            archiveHtml += "</div>";
            pane.innerHTML = archiveHtml;

            pane.querySelectorAll(".selection-popup-archive-delete-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => handleDeleteArchiveItem(e.target.dataset.itemId));
            });
        } else {
            pane.innerHTML = `
          <div class="selection-popup-error">
            ❌ ${escapeHtml(response?.error || "Không thể tải kho lưu trữ")}
          </div>
        `;
        }
    });
}

function handleSaveToArchive() {
    const archiveItem = {
        text: selectedText,
        translatedText: currentTranslationData?.translatedText || "",
        wikipediaInfo: currentTranslationData?.wikipediaInfo || null
    };

    chrome.runtime.sendMessage(
        { action: "saveArchive", item: archiveItem },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                alert("❌ Lỗi kết nối extension. Hãy reload extension tại chrome://extensions");
                return;
            }

            if (response?.success) {
                const saveBtn = popupContainer?.querySelector(".selection-popup-save-btn");
                if (saveBtn) {
                    const originalText = saveBtn.textContent;
                    saveBtn.textContent = "✅ Đã lưu!";
                    saveBtn.disabled = true;
                    setTimeout(() => {
                        if (popupContainer) {
                            saveBtn.textContent = originalText;
                            saveBtn.disabled = false;
                        }
                    }, 2000);
                }

                const archivePane = popupContainer?.querySelector('[data-storage-pane="archive"]');
                if (archivePane && archivePane.classList.contains("active")) {
                    loadStorageArchive();
                }
            } else {
                alert(`❌ Lỗi lưu: ${response?.error || "Vui lòng thử lại"}`);
            }
        }
    );
}

function handleDeleteArchiveItem(itemId) {
    if (!confirm("Bạn chắc chắn muốn xóa item này?")) {
        return;
    }

    chrome.runtime.sendMessage(
        { action: "deleteArchiveItem", id: itemId },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }

            if (response?.success) {
                const itemElement = popupContainer?.querySelector(`[data-item-id="${itemId}"]`);
                if (itemElement) {
                    itemElement.style.opacity = "0";
                    itemElement.style.transform = "translateX(-20px)";
                    setTimeout(() => {
                        itemElement.remove();
                    }, 300);
                }
            } else {
                alert(`❌ Lỗi xóa: ${response?.error || "Vui lòng thử lại"}`);
            }
        }
    );
}

function handleSaveUrlToArchive() {
    const title = document.title;
    const url = window.location.href;

    chrome.runtime.sendMessage(
        { action: "saveUrlArchive", title: title, url: url },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                alert("❌ Lỗi kết nối extension. Hãy reload extension tại chrome://extensions");
                return;
            }

            if (response?.success) {
                const saveUrlBtn = popupContainer?.querySelector(".selection-popup-save-url-btn");
                if (saveUrlBtn) {
                    const originalText = saveUrlBtn.textContent;
                    saveUrlBtn.textContent = "✅ Đã lưu URL!";
                    saveUrlBtn.disabled = true;
                    setTimeout(() => {
                        if (popupContainer) {
                            saveUrlBtn.textContent = originalText;
                            saveUrlBtn.disabled = false;
                        }
                    }, 2000);
                }
            } else {
                alert(`❌ ${response?.error || "Không thể lưu URL"}`);
            }
        }
    );
}

function loadUrlStorageArchive() {
    if (!popupContainer) return;
    const pane = popupContainer.querySelector('[data-storage-pane="url-archive"]');
    if (!pane) return;

    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang tải...
    </div>
  `;

    chrome.runtime.sendMessage({ action: "getUrlArchiveItems" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
        if (!popupContainer) return;

        if (response?.success && Array.isArray(response.items)) {
            const items = response.items;
            if (items.length === 0) {
                pane.innerHTML = `<div class="selection-popup-archive-empty">Chưa có URL nào được lưu</div>`;
                return;
            }

            let archiveHtml = '<div class="selection-popup-url-archive-list">';
            items.forEach((item) => {
                const savedDate = new Date(item.savedAt).toLocaleString("vi-VN");
                archiveHtml += `
            <div class="selection-popup-url-archive-item" data-item-id="${escapeHtml(item.id)}">
              <div class="selection-popup-url-archive-item-title">${escapeHtml(item.title)}</div>
              <a href="${escapeHtml(item.url)}" target="_blank" class="selection-popup-url-archive-item-link">
                🔗 ${escapeHtml(item.url.substring(0, 50))}${item.url.length > 50 ? "..." : ""}
              </a>
              <div class="selection-popup-url-archive-item-meta">
                <span class="selection-popup-url-archive-item-date">${escapeHtml(savedDate)}</span>
                <button class="selection-popup-url-archive-delete-btn" data-item-id="${escapeHtml(item.id)}">❌ Xóa</button>
              </div>
            </div>
          `;
            });
            archiveHtml += "</div>";
            pane.innerHTML = archiveHtml;

            pane.querySelectorAll(".selection-popup-url-archive-delete-btn").forEach((btn) => {
                btn.addEventListener("click", (e) => handleDeleteUrlArchiveItem(e.target.dataset.itemId));
            });
        } else {
            pane.innerHTML = `
          <div class="selection-popup-error">
            ❌ ${escapeHtml(response?.error || "Không thể tải danh sách URL")}
          </div>
        `;
        }
    });
}

function handleDeleteUrlArchiveItem(itemId) {
    if (!confirm("Bạn chắc chắn muốn xóa URL này?")) {
        return;
    }

    chrome.runtime.sendMessage(
        { action: "deleteUrlArchiveItem", id: itemId },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }

            if (response?.success) {
                const itemElement = popupContainer?.querySelector(`[data-item-id="${itemId}"]`);
                if (itemElement) {
                    itemElement.style.opacity = "0";
                    itemElement.style.transform = "translateX(-20px)";
                    setTimeout(() => {
                        itemElement.remove();
                    }, 300);
                }
            } else {
                alert(`❌ ${response?.error || "Không thể xóa URL"}`);
            }
        }
    );
}
