/**
 * Promise wrapper cho chrome.runtime.sendMessage (giữ nguyên message types).
 */

export function sendChromeMessage(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                resolve({
                    success: false,
                    connectionFailed: true,
                    error: chrome.runtime.lastError.message
                });
                return;
            }
            resolve(response);
        });
    });
}

export function useChromeMessage() {
    return { sendMessage: sendChromeMessage };
}
