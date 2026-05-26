/**
 * Content Script - Chạy trên context của trang web
 * Chịu trách nhiệm:
 * 1. Bắt sự kiện bôi đen text
 * 2. Hiện icon cạnh text được bôi đen
 * 3. Quản lý popup
 * 4. Gọi API dịch và Wikipedia qua background script
 */

// ===== Biến toàn cục =====

let selectedText = "";
let popupIcon = null;
let popupContainer = null;
let lastSelectionRect = null; // Vị trí selection lần cuối (dùng khi icon bị ẩn do click)
let suppressSelectionHide = false; // Tránh ẩn icon khi user tương tác với UI extension
let ignoreNextOutsideClick = false; // Bỏ qua click đóng popup ngay sau khi mở bằng mousedown
let currentTranslationData = null; // Lưu dữ liệu dịch/wiki hiện tại để lưu vào archive
let selectedHighlightColor = "#FFFF00"; // Màu highlight mặc định (vàng)

// ===== Khởi tạo =====

function initializeExtension() {
    console.log("Selection Translate & Wiki - Content script loaded");

    document.addEventListener("mouseup", handleTextSelection);
    document.addEventListener("touchend", handleTextSelection);
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("selectionchange", handleSelectionChange);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
    initializeExtension();
}

function handleTextSelection(event) {
    if (event?.target && (popupIcon?.contains(event.target) || popupContainer?.contains(event.target))) {
        return;
    }

    if (popupContainer) {
        return;
    }

    const selection = window.getSelection();
    selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        console.log("Text được bôi đen:", selectedText);
        showPopupIcon();
    } else if (!popupContainer && !suppressSelectionHide) {
        hidePopupIcon();
    }
}

function handleSelectionChange() {
    if (suppressSelectionHide || popupContainer) {
        return;
    }

    const selection = window.getSelection();
    if (selection.toString().trim().length === 0) {
        hidePopupIcon();
    }
}

function showPopupIcon() {
    if (popupIcon) {
        popupIcon.remove();
    }

    popupIcon = document.createElement("button");
    popupIcon.className = "selection-popup-icon";
    popupIcon.textContent = "TW";
    popupIcon.title = "Dịch & Wiki";

    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    lastSelectionRect = rect;

    popupIcon.style.left = `${rect.right + 8}px`;
    popupIcon.style.top = `${rect.top - 5}px`;
    document.body.appendChild(popupIcon);

    popupIcon.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        suppressSelectionHide = true;
        ignoreNextOutsideClick = true;
        showPopup();
        requestAnimationFrame(() => {
            suppressSelectionHide = false;
        });
    });
}

function hidePopupIcon() {
    if (popupIcon) {
        popupIcon.remove();
        popupIcon = null;
    }
}

function showPopup() {
    if (!selectedText) {
        return;
    }

    if (popupContainer) {
        popupContainer.remove();
    }

    popupContainer = document.createElement("div");
    popupContainer.className = "selection-popup-container";

    const anchorRect = popupIcon ? popupIcon.getBoundingClientRect() : lastSelectionRect;
    if (!anchorRect) {
        return;
    }

    let left = anchorRect.right + 8;
    let top = anchorRect.top;

    const maxWidth = 400;
    if (left + maxWidth > window.innerWidth) {
        left = anchorRect.left - maxWidth - 8;
    }

    if (top + 400 > window.innerHeight) {
        top = window.innerHeight - 400 - 16;
    }

    popupContainer.style.left = `${left}px`;
    popupContainer.style.top = `${top}px`;

    popupContainer.innerHTML = `
    <div class="selection-popup-header">
      <h3 class="selection-popup-title">Translate & Wiki</h3>
      <button class="selection-popup-close-btn">&times;</button>
    </div>
    
    <div class="selection-popup-tabs">
      <button class="selection-popup-tab-btn active" data-tab="translate">Dịch</button>
      <button class="selection-popup-tab-btn" data-tab="wiki">Wiki</button>
      <button class="selection-popup-tab-btn" data-tab="highlight">Highlight</button>
      <button class="selection-popup-tab-btn" data-tab="storage">Lưu trữ</button>
    </div>
    
    <div class="selection-popup-content">
      <div class="selection-popup-selected-text">${escapeHtml(selectedText)}</div>
      
      <div class="selection-popup-tab-pane active" data-pane="translate">
        <div class="selection-popup-loading">
          <span class="selection-popup-spinner"></span>
          Đang dịch...
        </div>
      </div>
      
      <div class="selection-popup-tab-pane" data-pane="wiki">
        <div class="selection-popup-loading">
          <span class="selection-popup-spinner"></span>
          Đang tìm kiếm...
        </div>
      </div>
      
      <div class="selection-popup-tab-pane" data-pane="storage">
        <div class="selection-popup-storage-tabs">
          <button class="selection-popup-storage-tab-btn active" data-storage-tab="new">Lưu trữ mới</button>
          <button class="selection-popup-storage-tab-btn" data-storage-tab="archive">Kho lưu trữ</button>
        </div>
        
        <div class="selection-popup-storage-pane active" data-storage-pane="new">
          <div class="selection-popup-storage-new">
            <p class="selection-popup-storage-info">Nhấn nút bên dưới để lưu từng này vào kho</p>
            <button class="selection-popup-save-btn">Lưu từng này</button>
          </div>
        </div>
        
        <div class="selection-popup-storage-pane" data-storage-pane="archive">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tải...
          </div>
        </div>
      </div>

      <div class="selection-popup-tab-pane" data-pane="highlight">
        <div class="selection-popup-highlight-content">
          <p class="selection-popup-highlight-label">Chọn màu highlight:</p>
          <div class="selection-popup-color-picker">
            <button class="selection-popup-color-btn" data-color="#FFFF00" title="Vàng" style="background-color: #FFFF00"></button>
            <button class="selection-popup-color-btn" data-color="#FF6B6B" title="Đỏ" style="background-color: #FF6B6B"></button>
            <button class="selection-popup-color-btn" data-color="#4ECDC4" title="Xanh nhạt" style="background-color: #4ECDC4"></button>
            <button class="selection-popup-color-btn" data-color="#95E1D3" title="Xanh lá" style="background-color: #95E1D3"></button>
            <button class="selection-popup-color-btn" data-color="#FFB6D9" title="Hồng" style="background-color: #FFB6D9"></button>
            <button class="selection-popup-color-btn" data-color="#C7CEEA" title="Tím" style="background-color: #C7CEEA"></button>
          </div>
          <button class="selection-popup-highlight-apply-btn">Highlight text này</button>
          <p class="selection-popup-highlight-hint">Tip: Di chuột vào highlight để xóa</p>
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(popupContainer);

    popupContainer.querySelector(".selection-popup-close-btn").addEventListener("click", hidePopup);
    popupContainer.querySelectorAll(".selection-popup-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchTab(e.target.dataset.tab));
    });
    popupContainer.querySelectorAll(".selection-popup-storage-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchStorageTab(e.target.dataset.storageTab));
    });

    const saveBtn = popupContainer.querySelector(".selection-popup-save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", handleSaveToArchive);
    }

    popupContainer.querySelectorAll(".selection-popup-color-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const colorBtn = e.currentTarget;
            const color = colorBtn.dataset.color;
            if (!color) return;

            selectedHighlightColor = color;
            popupContainer.querySelectorAll(".selection-popup-color-btn").forEach((b) => b.classList.remove("active"));
            colorBtn.classList.add("active");
        });
    });

    const defaultColorBtn = popupContainer.querySelector('.selection-popup-color-btn[data-color="#FFFF00"]');
    if (defaultColorBtn) {
        defaultColorBtn.classList.add("active");
    }

    const highlightApplyBtn = popupContainer.querySelector(".selection-popup-highlight-apply-btn");
    if (highlightApplyBtn) {
        highlightApplyBtn.addEventListener("click", handleApplyHighlight);
    }

    loadTranslateContent();
}

function hidePopup() {
    if (popupContainer) {
        popupContainer.remove();
        popupContainer = null;
    }
    if (!selectedText) {
        hidePopupIcon();
    }
}

function switchTab(tabName) {
    if (!popupContainer) return;
    popupContainer.querySelectorAll(".selection-popup-tab-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.tab === tabName) {
            btn.classList.add("active");
        }
    });

    popupContainer.querySelectorAll(".selection-popup-tab-pane").forEach((pane) => pane.classList.remove("active"));
    const activePane = popupContainer.querySelector(`[data-pane="${tabName}"]`);
    if (activePane) {
        activePane.classList.add("active");
    }

    if (tabName === "translate") {
        loadTranslateContent();
    } else if (tabName === "wiki") {
        loadWikiContent();
    } else if (tabName === "storage") {
        switchStorageTab("new");
    }
}

function loadTranslateContent() {
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
                const language = response.language === "vi" ? "🇻🇳" : "🇬🇧";
                const description = response.description || "";
                const excerpt = description.length > 300 ? `${description.substring(0, 300)}...` : description;

                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-title">${language} ${escapeHtml(response.title)}</div>
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

function handleClickOutside(event) {
    if (!popupContainer) return;
    if (ignoreNextOutsideClick) {
        ignoreNextOutsideClick = false;
        return;
    }

    if (popupIcon?.contains(event.target)) return;
    if (popupContainer.contains(event.target)) return;

    hidePopup();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

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
