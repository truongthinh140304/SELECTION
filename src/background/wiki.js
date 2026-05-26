/**
 * Tìm kiếm Wikipedia (ưu tiên vi rồi đến en).
 */
async function searchWikipedia(text) {
    try {
        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        let result = await searchWikipediaByLanguage(cleanText, "vi");
        if (!result) {
            result = await searchWikipediaByLanguage(cleanText, "en");
        }
        if (!result) {
            throw new Error("Không tìm thấy kết quả trên Wikipedia");
        }

        return result;
    } catch (error) {
        throw new Error(`Lỗi Wikipedia: ${error.message}`);
    }
}

async function searchWikipediaByLanguage(text, language) {
    try {
        const domain = language === "vi" ? "vi.wikipedia.org" : "en.wikipedia.org";
        const searchUrl = `https://${domain}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(text)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`HTTP error! status: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return null;
        }

        const firstResult = searchData.query.search[0];
        const title = firstResult.title;
        const summaryUrl = `https://${domain}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryResponse = await fetch(summaryUrl);

        if (!summaryResponse.ok) {
            return {
                title,
                description: firstResult.snippet || "Không có mô tả",
                url: `https://${domain}/wiki/${encodeURIComponent(title)}`,
                language
            };
        }

        const summaryData = await summaryResponse.json();
        return {
            title: summaryData.title,
            description: summaryData.extract || summaryData.description || "Không có mô tả",
            url: summaryData.content_urls.desktop.page,
            language
        };
    } catch (error) {
        return null;
    }
}
