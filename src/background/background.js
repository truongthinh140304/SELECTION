/**
 * Background service worker.
 */

importScripts("storage.js", "highlight-storage.js", "translate.js", "wiki.js", "summarize.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        handleTranslate(request.text, sendResponse);
    } else if (request.action === "searchWikipedia") {
        handleSearchWikipedia(request.text, sendResponse);
    } else if (request.action === "saveArchive") {
        handleSaveArchive(request.item, sendResponse);
    } else if (request.action === "deleteArchiveItem") {
        handleDeleteArchiveItem(request.id, sendResponse);
    } else if (request.action === "getArchiveItems") {
        handleGetArchiveItems(sendResponse);
    } else if (request.action === "saveHighlight") {
        handleSaveHighlight(request.text, request.color, request.pageUrl, sendResponse);
    } else if (request.action === "deleteHighlight") {
        handleDeleteHighlight(request.id, request.pageUrl, sendResponse);
    } else if (request.action === "summarizeSelection") {
        handleSummarizeSelection(request.text, sendResponse);
    } else if (request.action === "summarizeFullPage") {
        handleSummarizeFullPage(request.text, sendResponse);
    } else if (request.action === "saveUrlArchive") {
        handleSaveUrlArchive(request.title, request.url, sendResponse);
    } else if (request.action === "getUrlArchiveItems") {
        handleGetUrlArchiveItems(sendResponse);
    } else if (request.action === "deleteUrlArchiveItem") {
        handleDeleteUrlArchiveItem(request.id, sendResponse);
    }

    return true;
});

function handleTranslate(text, sendResponse) {
    translateText(text)
        .then((translatedText) => sendResponse({ success: true, translatedText }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleSearchWikipedia(text, sendResponse) {
    searchWikipedia(text)
        .then((result) =>
            sendResponse({
                success: true,
                title: result.title,
                description: result.description,
                url: result.url,
                language: result.language
            })
        )
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleSaveArchive(item, sendResponse) {
    saveToArchive(item)
        .then((savedItem) =>
            sendResponse({
                success: true,
                item: savedItem,
                message: "Đã lưu thành công!"
            })
        )
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleDeleteArchiveItem(id, sendResponse) {
    deleteArchiveItem(id)
        .then((deleted) =>
            sendResponse({
                success: deleted,
                message: deleted ? "Đã xóa thành công!" : "Không tìm thấy item"
            })
        )
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleGetArchiveItems(sendResponse) {
    getAllArchiveItems()
        .then((items) => sendResponse({ success: true, items }))
        .catch((error) => sendResponse({ success: false, error: error.message, items: [] }));
}

function handleSaveHighlight(text, color, pageUrl, sendResponse) {
    saveHighlight(text, color, pageUrl)
        .then((id) => sendResponse({ success: true, id }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleDeleteHighlight(id, pageUrl, sendResponse) {
    deleteHighlight(id, pageUrl)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleSummarizeSelection(text, sendResponse) {
    summarizeSelection(text)
        .then((summary) => sendResponse({ success: true, summary }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleSummarizeFullPage(text, sendResponse) {
    summarizeContent(text)
        .then((summary) => sendResponse({ success: true, summary }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleSaveUrlArchive(title, url, sendResponse) {
    saveUrlToArchive(title, url)
        .then((item) =>
            sendResponse({
                success: true,
                item: item,
                message: "Đã lưu URL thành công!"
            })
        )
        .catch((error) => sendResponse({ success: false, error: error.message }));
}

function handleGetUrlArchiveItems(sendResponse) {
    getAllUrlArchiveItems()
        .then((items) => sendResponse({ success: true, items }))
        .catch((error) => sendResponse({ success: false, error: error.message, items: [] }));
}

function handleDeleteUrlArchiveItem(id, sendResponse) {
    deleteUrlArchiveItem(id)
        .then((deleted) =>
            sendResponse({
                success: deleted,
                message: deleted ? "Đã xóa thành công!" : "Không tìm thấy item"
            })
        )
        .catch((error) => sendResponse({ success: false, error: error.message }));
}
