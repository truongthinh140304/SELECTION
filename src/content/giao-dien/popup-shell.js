/**
 * Popup container: show/hide, tabs, drag, theme.
 */

function showPopup() {
    if (!selectedText) {
        return;
    }

    if (popupContainer) {
        popupContainer.remove();
    }

    popupContainer = document.createElement("div");
    popupContainer.className = "selection-popup-container";

    const maxWidth = 400;
    let left = (window.innerWidth - maxWidth) / 2;
    let top = 60;

    popupContainer.style.left = `${left}px`;
    popupContainer.style.top = `${top}px`;

    popupContainer.innerHTML = getPopupHtml();

    document.body.appendChild(popupContainer);

    popupContainer.querySelector(".selection-popup-close-btn").addEventListener("click", hidePopup);
    popupContainer.querySelector(".selection-popup-theme-toggle-btn").addEventListener("click", toggleTheme);
    popupContainer.querySelectorAll(".selection-popup-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchTab(e.currentTarget.dataset.tab));
    });
    popupContainer.querySelectorAll(".selection-popup-storage-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchStorageTab(e.currentTarget.dataset.storageTab));
    });
    popupContainer.querySelectorAll(".selection-popup-summarize-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => switchSummarizeTab(e.currentTarget.dataset.summarizeTab));
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

    setupPopupDrag();

    showTranslateButton();
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
        showTranslateButton();
    } else if (tabName === "wiki") {
        loadWikiContent();
    } else if (tabName === "summarize") {
        switchSummarizeTab("selection");
    } else if (tabName === "storage") {
        switchStorageTab("new");
    }
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
