/**
 * Background Service Worker - Chạy ở background
 * Chịu trách nhiệm:
 * 1. Nhận message từ content script
 * 2. Gọi API dịch và Wikipedia
 * 3. Trả kết quả về content script
 */

// Kiểm tra nếu API file tồn tại (development mode)
// Nếu không, hãy tự thêm logic tương tự từ api/translate.js và api/wiki.js

// ===== Message Handler =====

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request.action);

    if (request.action === "translate") {
        handleTranslate(request.text, sendResponse);
    } else if (request.action === "searchWikipedia") {
        handleSearchWikipedia(request.text, sendResponse);
    }

    // Trả về true để biết rằng sẽ gửi sendResponse sau
    return true;
});

// ===== Xử lý dịch =====

function handleTranslate(text, sendResponse) {
    translateText(text)
        .then(translatedText => {
            sendResponse({
                success: true,
                translatedText: translatedText
            });
        })
        .catch(error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });
}

// ===== Xử lý tìm Wikipedia =====

function handleSearchWikipedia(text, sendResponse) {
    searchWikipedia(text)
        .then(result => {
            sendResponse({
                success: true,
                title: result.title,
                description: result.description,
                url: result.url,
                language: result.language
            });
        })
        .catch(error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });
}

// ===== Hàm dịch text sang tiếng Việt =====

async function translateText(text) {
    try {
        // Loại bỏ các khoảng trắng thừa
        const cleanText = text.trim();

        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        // Sử dụng MyMemory API (miễn phí, không cần API key)
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|vi`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Kiểm tra xem API có trả về kết quả không
        if (data.responseStatus === 200) {
            const translatedText = data.responseData.translatedText;

            // Nếu text được dịch giống y text gốc, có thể text đã là Tiếng Việt
            if (translatedText === cleanText) {
                return "Text có thể đã là tiếng Việt hoặc không cần dịch";
            }

            return translatedText;
        } else {
            throw new Error("API không trả về kết quả dịch");
        }
    } catch (error) {
        console.error("Lỗi dịch text:", error);
        throw new Error(`Lỗi dịch: ${error.message}`);
    }
}

// ===== Hàm tìm kiếm Wikipedia =====

async function searchWikipedia(text) {
    try {
        const cleanText = text.trim();

        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        // Thử Wikipedia tiếng Việt trước
        console.log("Tìm kiếm Wikipedia tiếng Việt...");
        let result = await searchWikipediaByLanguage(cleanText, "vi");

        // Nếu không tìm thấy tiếng Việt, thử tiếng Anh
        if (!result) {
            console.log("Không tìm thấy tiếng Việt, thử tiếng Anh...");
            result = await searchWikipediaByLanguage(cleanText, "en");
        }

        if (!result) {
            throw new Error("Không tìm thấy kết quả trên Wikipedia");
        }

        return result;
    } catch (error) {
        console.error("Lỗi tìm kiếm Wikipedia:", error);
        throw new Error(`Lỗi Wikipedia: ${error.message}`);
    }
}

// ===== Hàm tìm kiếm Wikipedia trong một ngôn ngữ cụ thể =====

async function searchWikipediaByLanguage(text, language) {
    try {
        const domain = language === "vi" ? "vi.wikipedia.org" : "en.wikipedia.org";

        // Bước 1: Tìm kiếm để lấy title
        const searchUrl = `https://${domain}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(text)}&format=json&origin=*`;

        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
            throw new Error(`HTTP error! status: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        // Kiểm tra xem có kết quả tìm kiếm không
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return null;
        }

        // Lấy title của kết quả đầu tiên
        const firstResult = searchData.query.search[0];
        const title = firstResult.title;

        // Bước 2: Lấy tóm tắt bài viết
        const summaryUrl = `https://${domain}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

        const summaryResponse = await fetch(summaryUrl);

        if (!summaryResponse.ok) {
            // Nếu không lấy được summary, sử dụng snippet từ kết quả tìm kiếm
            return {
                title: title,
                description: firstResult.snippet || "Không có mô tả",
                url: `https://${domain}/wiki/${encodeURIComponent(title)}`,
                language: language
            };
        }

        const summaryData = await summaryResponse.json();

        return {
            title: summaryData.title,
            description: summaryData.extract || summaryData.description || "Không có mô tả",
            url: summaryData.content_urls.desktop.page,
            language: language
        };
    } catch (error) {
        console.error(`Lỗi tìm kiếm Wikipedia ${language}:`, error);
        return null;
    }
}
