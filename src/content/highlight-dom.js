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

function createHighlightedFragment(text, pattern, color, id, highlightText) {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    text.replace(pattern, (match, _group, offset) => {
        if (offset > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const mark = document.createElement("mark");
        mark.className = HIGHLIGHT_CLASS;
        mark.style.backgroundColor = color;
        mark.dataset.highlightId = id;
        mark.dataset.highlightText = highlightText;
        mark.textContent = match;

        fragment.appendChild(mark);

        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
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
            const fragment = createHighlightedFragment(
                textNode.textContent,
                pattern,
                color,
                id,
                trimmed
            );

            textNode.parentNode.replaceChild(fragment, textNode);
        });

        return true;
    } catch (error) {
        console.error("Error highlighting text:", error);
        return false;
    }
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