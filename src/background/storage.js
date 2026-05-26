/**
 * Storage module (background) - quản lý kho lưu trữ translation.
 */

const STORAGE_KEY = "translationArchive";

function readArchiveFromStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            const data = result[STORAGE_KEY];
            resolve(Array.isArray(data) ? data : []);
        });
    });
}

function writeArchiveToStorage(archive) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: archive }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

async function saveToArchive(item) {
    try {
        const archive = await readArchiveFromStorage();

        const newItem = {
            id: Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            text: item.text,
            translatedText: item.translatedText,
            wikipediaInfo: item.wikipediaInfo || null,
            savedAt: new Date().toISOString()
        };

        archive.unshift(newItem);
        await writeArchiveToStorage(archive);
        return newItem;
    } catch (error) {
        throw new Error(`Lỗi lưu: ${error.message}`);
    }
}

async function deleteArchiveItem(id) {
    try {
        const archive = await readArchiveFromStorage();
        const filteredArchive = archive.filter((item) => item.id !== id);

        if (filteredArchive.length === archive.length) {
            return false;
        }

        await writeArchiveToStorage(filteredArchive);
        return true;
    } catch (error) {
        throw new Error(`Lỗi xóa: ${error.message}`);
    }
}

async function getAllArchiveItems() {
    try {
        return await readArchiveFromStorage();
    } catch (error) {
        return [];
    }
}
