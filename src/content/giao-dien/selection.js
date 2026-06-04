/**
 * Text selection, floating icon, and extension bootstrap.
 */

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
