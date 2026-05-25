/**
 * Tìm kiếm Wikipedia
 * Đầu tiên thử Wikipedia tiếng Việt, nếu không có kết quả thì thử tiếng Anh
 * 
 * @param {string} text - Text cần tìm kiếm
 * @returns {Promise<Object>} - Object chứa title, description, url và language
 */
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

/**
 * Tìm kiếm Wikipedia trong một ngôn ngữ cụ thể
 * 
 * @param {string} text - Text cần tìm kiếm
 * @param {string} language - Mã ngôn ngữ ('vi' hoặc 'en')
 * @returns {Promise<Object|null>} - Object chứa title, description, url hoặc null nếu không tìm thấy
 */
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
