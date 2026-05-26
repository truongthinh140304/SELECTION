/**
 * Highlight storage (background service worker).
 */

const HIGHLIGHT_STORAGE_KEY = "pageHighlights";

async function saveHighlight(text, color, pageUrl) {
    const highlights = await getHighlights(pageUrl);
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    highlights.push({
        id,
        text,
        color,
        timestamp: new Date().toISOString()
    });

    const storage = {};
    storage[`${HIGHLIGHT_STORAGE_KEY}_${pageUrl}`] = highlights;
    await chrome.storage.local.set(storage);

    return id;
}

async function getHighlights(pageUrl) {
    try {
        const key = `${HIGHLIGHT_STORAGE_KEY}_${pageUrl}`;
        const result = await chrome.storage.local.get(key);
        return result[key] || [];
    } catch (error) {
        return [];
    }
}

async function deleteHighlight(id, pageUrl) {
    const highlights = await getHighlights(pageUrl);
    const filtered = highlights.filter((h) => h.id !== id);

    const storage = {};
    storage[`${HIGHLIGHT_STORAGE_KEY}_${pageUrl}`] = filtered;
    await chrome.storage.local.set(storage);

    return true;
}
