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
let currentTab = "translate"; // Tab hiện tại: "translate" hoặc "wiki"
let lastSelectionRect = null; // Vị trí selection lần cuối (dùng khi icon bị ẩn do click)
let suppressSelectionHide = false; // Tránh ẩn icon khi user tương tác với UI extension
let ignoreNextOutsideClick = false; // Bỏ qua click đóng popup ngay sau khi mở bằng mousedown

// ===== Khởi tạo =====

function initializeExtension() {
    console.log("Selection Translate & Wiki - Content script loaded");

    // Bắt sự kiện bôi đen text
    document.addEventListener("mouseup", handleTextSelection);
    document.addEventListener("touchend", handleTextSelection);

    // Đóng popup khi click ra ngoài
    document.addEventListener("click", handleClickOutside);

    // Xóa popup khi bỏ chọn text
    document.addEventListener("selectionchange", handleSelectionChange);
}

// Gọi ngay nếu DOM đã ready, hoặc chờ event
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
    initializeExtension();
}

// ===== Xử lý bôi đen text =====

function handleTextSelection(event) {
    // Bỏ qua mouseup/touchend từ chính UI extension (tránh đóng popup ngay sau khi mở)
    if (event?.target && (
        popupIcon?.contains(event.target) ||
        popupContainer?.contains(event.target)
    )) {
        return;
    }

    const selection = window.getSelection();
    selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        console.log("Text được bôi đen:", selectedText);
        showPopupIcon(event);
    } else if (!popupContainer && !suppressSelectionHide) {
        hidePopupIcon();
    }
}

// ===== Xử lý khi selection thay đổi =====

function handleSelectionChange() {
    if (suppressSelectionHide || popupContainer) {
        return;
    }

    const selection = window.getSelection();

    // Nếu không có text được chọn, ẩn icon
    if (selection.toString().trim().length === 0) {
        hidePopupIcon();
    }
}

// ===== Hiện icon cạnh text được bôi đen =====

function showPopupIcon(event) {
    // Nếu icon đã tồn tại, xóa nó trước
    if (popupIcon) {
        popupIcon.remove();
    }

    // Tạo icon button
    popupIcon = document.createElement("button");
    popupIcon.className = "selection-popup-icon";
    popupIcon.textContent = "TW";
    popupIcon.title = "Dịch & Wiki";

    // Xác định vị trí hiển thị icon
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    lastSelectionRect = rect;

    // Hiện icon bên phải text được bôi đen, hơi phía trên một chút
    popupIcon.style.left = (rect.right + 8) + "px";
    popupIcon.style.top = (rect.top - 5) + "px";

    // Thêm icon vào trang
    document.body.appendChild(popupIcon);

    // mousedown (không phải click) để mở popup trước khi browser xóa selection
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

// ===== Ẩn icon =====

function hidePopupIcon() {
    if (popupIcon) {
        popupIcon.remove();
        popupIcon = null;
    }
}

// ===== Hiện popup =====

function showPopup() {
    if (!selectedText) {
        return;
    }

    console.log("showPopup() được gọi");

    // Xóa popup cũ nếu tồn tại
    if (popupContainer) {
        popupContainer.remove();
    }

    // Tạo popup container
    popupContainer = document.createElement("div");
    popupContainer.className = "selection-popup-container";

    // Tính toán vị trí popup (icon có thể đã bị xóa do selectionchange)
    const anchorRect = popupIcon
        ? popupIcon.getBoundingClientRect()
        : lastSelectionRect;
    if (!anchorRect) {
        return;
    }

    let left = anchorRect.right + 8;
    let top = anchorRect.top;

    // Đảm bảo popup không tràn ra ngoài viewport
    const maxWidth = 400;
    if (left + maxWidth > window.innerWidth) {
        left = anchorRect.left - maxWidth - 8;
    }

    if (top + 400 > window.innerHeight) {
        top = window.innerHeight - 400 - 16;
    }

    popupContainer.style.left = left + "px";
    popupContainer.style.top = top + "px";

    // HTML nội dung popup
    popupContainer.innerHTML = `
    <div class="selection-popup-header">
      <h3 class="selection-popup-title">Translate & Wiki</h3>
      <button class="selection-popup-close-btn">&times;</button>
    </div>
    
    <div class="selection-popup-tabs">
      <button class="selection-popup-tab-btn active" data-tab="translate">Dịch</button>
      <button class="selection-popup-tab-btn" data-tab="wiki">Wiki</button>
    </div>
    
    <div class="selection-popup-content">
      <div class="selection-popup-selected-text">${escapeHtml(selectedText)}</div>
      
      <!-- Tab Dịch -->
      <div class="selection-popup-tab-pane active" data-pane="translate">
        <div class="selection-popup-loading">
          <span class="selection-popup-spinner"></span>
          Đang dịch...
        </div>
      </div>
      
      <!-- Tab Wiki -->
      <div class="selection-popup-tab-pane" data-pane="wiki">
        <div class="selection-popup-loading">
          <span class="selection-popup-spinner"></span>
          Đang tìm kiếm...
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(popupContainer);

    // Bắt sự kiện click nút đóng
    popupContainer.querySelector(".selection-popup-close-btn").addEventListener("click", hidePopup);

    // Bắt sự kiện click tab buttons
    popupContainer.querySelectorAll(".selection-popup-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => switchTab(e.target.dataset.tab));
    });

    // Tải nội dung tab Dịch
    loadTranslateContent();
}

// ===== Ẩn popup =====

function hidePopup() {
    if (popupContainer) {
        popupContainer.remove();
        popupContainer = null;
    }
    if (!selectedText) {
        hidePopupIcon();
    }
}

// ===== Chuyển đổi tab =====

function switchTab(tabName) {
    if (!popupContainer) return;

    currentTab = tabName;

    // Cập nhật active tab button
    popupContainer.querySelectorAll(".selection-popup-tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.tab === tabName) {
            btn.classList.add("active");
        }
    });

    // Cập nhật active tab pane
    popupContainer.querySelectorAll(".selection-popup-tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });
    const activePane = popupContainer.querySelector(`[data-pane="${tabName}"]`);
    if (activePane) {
        activePane.classList.add("active");
    }

    // Tải nội dung
    if (tabName === "translate") {
        loadTranslateContent();
    } else if (tabName === "wiki") {
        loadWikiContent();
    }
}

// ===== Tải nội dung Dịch =====

function loadTranslateContent() {
    if (!popupContainer) return;

    const pane = popupContainer.querySelector('[data-pane="translate"]');
    if (!pane) return;

    // Hiển thị loading
    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang dịch...
    </div>
  `;

    // Gọi API dịch
    chrome.runtime.sendMessage(
        {
            action: "translate",
            text: selectedText
        },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            if (!popupContainer) return;

            if (response?.success) {
                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-description">
              ${escapeHtml(response.translatedText)}
            </div>
          </div>
        `;
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

// ===== Tải nội dung Wiki =====

function loadWikiContent() {
    if (!popupContainer) return;

    const pane = popupContainer.querySelector('[data-pane="wiki"]');
    if (!pane) return;

    // Hiển thị loading
    pane.innerHTML = `
    <div class="selection-popup-loading">
      <span class="selection-popup-spinner"></span>
      Đang tìm kiếm...
    </div>
  `;

    // Gọi API Wikipedia
    chrome.runtime.sendMessage(
        {
            action: "searchWikipedia",
            text: selectedText
        },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            if (!popupContainer) return;

            if (response?.success) {
                const language = response.language === "vi" ? "🇻🇳" : "🇬🇧";
                const description = response.description || "";
                const excerpt = description.length > 300
                    ? description.substring(0, 300) + "..."
                    : description;
                pane.innerHTML = `
          <div class="selection-popup-result">
            <div class="selection-popup-result-title">
              ${language} ${escapeHtml(response.title)}
            </div>
            <div class="selection-popup-result-description">
              ${escapeHtml(excerpt)}
            </div>
            <a href="${response.url}" target="_blank" class="selection-popup-result-link">
              📖 Đọc thêm trên Wikipedia →
            </a>
          </div>
        `;
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

// ===== Xử lý click ra ngoài popup =====

function handleClickOutside(event) {
    if (!popupContainer) return;

    if (ignoreNextOutsideClick) {
        ignoreNextOutsideClick = false;
        return;
    }

    // Nếu click vào icon hoặc popup, không đóng
    if (popupIcon?.contains(event.target)) return;
    if (popupContainer.contains(event.target)) return;

    hidePopup();
}

// ===== Utility: Escape HTML =====

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
