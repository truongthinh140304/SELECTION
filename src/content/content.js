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

    // Vị trí mặc định: giữa màn hình, phía trên
    const maxWidth = 400;
    let left = (window.innerWidth - maxWidth) / 2; // Giữa màn hình theo chiều ngang
    let top = 60; // Phía trên màn hình

    popupContainer.style.left = `${left}px`;
    popupContainer.style.top = `${top}px`;

    popupContainer.innerHTML = `
    <div class="selection-popup-header selection-popup-draggable">
      <h3 class="selection-popup-title">Translate & Wiki</h3>
      <div class="selection-popup-header-buttons">
        <button class="selection-popup-theme-toggle-btn" title="Toggle dark mode">🌙</button>
        <button class="selection-popup-close-btn">&times;</button>
      </div>
    </div>
    
    <div class="selection-popup-tabs">
      <button class="selection-popup-tab-btn active" data-tab="translate">Dịch</button>
      <button class="selection-popup-tab-btn" data-tab="wiki">Wiki</button>
      <button class="selection-popup-tab-btn" data-tab="summarize">Tóm tắt</button>
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
      
      <div class="selection-popup-tab-pane" data-pane="summarize">
        <div class="selection-popup-summarize-tabs">
          <button class="selection-popup-summarize-tab-btn active" data-summarize-tab="selection">Tóm tắt đoạn</button>
          <button class="selection-popup-summarize-tab-btn" data-summarize-tab="fullpage">Tóm tắt tất cả</button>
        </div>
        
        <div class="selection-popup-summarize-pane active" data-summarize-pane="selection">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tóm tắt...
          </div>
        </div>
        
        <div class="selection-popup-summarize-pane" data-summarize-pane="fullpage">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tóm tắt...
          </div>
        </div>
      </div>
      
      <div class="selection-popup-tab-pane" data-pane="storage">
        <div class="selection-popup-storage-tabs">
          <button class="selection-popup-storage-tab-btn active" data-storage-tab="new">Lưu trữ mới</button>
          <button class="selection-popup-storage-tab-btn" data-storage-tab="url-archive">URL đã lưu</button>
          <button class="selection-popup-storage-tab-btn" data-storage-tab="archive">Lưu linh tinh</button>
        </div>
        
        <div class="selection-popup-storage-pane active" data-storage-pane="new">
          <div class="selection-popup-storage-new">
            <p class="selection-popup-storage-info">Nhấn nút bên dưới để lưu từng này vào kho</p>
            <div class="selection-popup-button-group">
              <button class="selection-popup-save-btn">Lưu từng này</button>
              <button class="selection-popup-save-url-btn">Lưu URL trang này</button>
            </div>
          </div>
        </div>
        
        <div class="selection-popup-storage-pane" data-storage-pane="url-archive">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tải...
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
    popupContainer.querySelector(".selection-popup-theme-toggle-btn").addEventListener("click", toggleTheme);
    popupContainer.querySelectorAll(".selection-popup-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchTab(e.target.dataset.tab));
    });
    popupContainer.querySelectorAll(".selection-popup-storage-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchStorageTab(e.target.dataset.storageTab));
    });
    popupContainer.querySelectorAll(".selection-popup-summarize-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchSummarizeTab(e.target.dataset.summarizeTab));
    });

    const saveBtn = popupContainer.querySelector(".selection-popup-save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", handleSaveToArchive);
    }

    const saveUrlBtn = popupContainer.querySelector(".selection-popup-save-url-btn");
    if (saveUrlBtn) {
        saveUrlBtn.addEventListener("click", handleSaveUrlToArchive);
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

    // Thêm chức năng kéo popup
    setupPopupDrag();

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
    } else if (tabName === "summarize") {
        switchSummarizeTab("selection");
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

    // Lấy nội dung text từ trang
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

function setupPopupDrag() {
    if (!popupContainer) return;

    const header = popupContainer.querySelector(".selection-popup-draggable");
    if (!header) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    header.addEventListener("mousedown", (e) => {
        // Không kéo khi click vào nút close
        if (e.target.closest(".selection-popup-close-btn")) {
            return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = popupContainer.offsetLeft;
        initialTop = popupContainer.offsetTop;
        header.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging || !popupContainer) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Giới hạn popup không ra ngoài viewport
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - popupContainer.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - popupContainer.offsetHeight));

        popupContainer.style.left = `${newLeft}px`;
        popupContainer.style.top = `${newTop}px`;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging && header) {
            header.style.cursor = "grab";
        }
        isDragging = false;
    });

    header.style.cursor = "grab";
}

function toggleTheme() {
    if (!popupContainer) return;

    const isDarkMode = popupContainer.classList.toggle("dark");
    const themeBtn = popupContainer.querySelector(".selection-popup-theme-toggle-btn");

    if (themeBtn) {
        themeBtn.textContent = isDarkMode ? "☀️" : "🌙";
    }
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
