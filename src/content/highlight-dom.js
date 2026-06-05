/**
 * Highlight DOM - chạy trong content script
 */

const HIGHLIGHT_CLASS = "selection-highlight";
const HIGHLIGHT_STORAGE_KEY = "pageHighlights";

async function getHighlightsForPage(pageUrl) {
    try {
        const key = `${HIGHLIGHT_STORAGE_KEY}_${pageUrl}`;
        const result = await chrome.storage.local.get(key);
        return result[key] || [];
    } catch (error) {
        console.error("Error getting highlights:", error);
        return [];
    }
}

function shouldSkipHighlightNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest(".selection-popup-container, .selection-popup-icon")) {
        return true;
    }
    if (parent.closest(`.${HIGHLIGHT_CLASS}`)) {
        return true;
    }
    const tag = parent.tagName;
    return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT";
}

function highlightTextInPage(text, color, id) {
    try {
        const trimmed = text.trim();
        if (!trimmed) return false;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
        );

        const nodesToReplace = [];
        let node;

        while ((node = walker.nextNode())) {
            if (shouldSkipHighlightNode(node)) continue;
            if (node.textContent.includes(trimmed)) {
                nodesToReplace.push(node);
            }
        }

        if (nodesToReplace.length === 0) {
            console.warn("Text not found in page:", trimmed);
            return false;
        }

        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`(${escaped})`, "g");

        nodesToReplace.forEach((textNode) => {
            const wrapper = document.createElement("span");
            wrapper.innerHTML = textNode.textContent.replace(
                pattern,
                `<mark class="${HIGHLIGHT_CLASS}" style="background-color: ${color}" data-highlight-id="${id}" data-highlight-text="${escapeHtmlAttr(trimmed)}">$1</mark>`
            );
            textNode.parentNode.replaceChild(wrapper, textNode);
        });

        return true;
    } catch (error) {
        console.error("Error highlighting text:", error);
        return false;
    }
}

function escapeHtmlAttr(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function unwrapHighlightElement(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
    parent.normalize();
}

function setupHighlightHover(highlightId) {
    const highlights = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);

    highlights.forEach((hl) => {
        if (hl.dataset.hoverBound === "1") return;
        hl.dataset.hoverBound = "1";

        hl.addEventListener("mouseenter", () => {
            let deleteBtn = hl.querySelector(".selection-highlight-delete");
            if (!deleteBtn) {
                deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "selection-highlight-delete";
                deleteBtn.textContent = "✕";
                deleteBtn.title = "Xóa highlight";

                deleteBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const pageUrl = window.location.href;
                    chrome.runtime.sendMessage(
                        {
                            action: "deleteHighlight",
                            id: highlightId,
                            pageUrl
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.error(chrome.runtime.lastError);
                                return;
                            }
                            if (response?.success) {
                                document
                                    .querySelectorAll(`[data-highlight-id="${highlightId}"]`)
                                    .forEach(unwrapHighlightElement);
                            }
                        }
                    );
                });

                hl.appendChild(deleteBtn);
            }
            deleteBtn.style.display = "inline";
        });

        hl.addEventListener("mouseleave", () => {
            const deleteBtn = hl.querySelector(".selection-highlight-delete");
            if (deleteBtn) {
                deleteBtn.style.display = "none";
            }
        });
    });
}

async function applyPageHighlights() {
    try {
        const pageUrl = window.location.href;
        const highlights = await getHighlightsForPage(pageUrl);

        highlights.forEach((hl) => {
            highlightTextInPage(hl.text, hl.color, hl.id);
            setupHighlightHover(hl.id);
        });
    } catch (error) {
        console.error("Error applying highlights:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyPageHighlights);
} else {
    applyPageHighlights();
}
