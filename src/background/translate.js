/**
 * Dịch text sang tiếng Việt qua MyMemory API.
 */
async function translateText(text) {
    try {
        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|vi`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.responseStatus === 200) {
            const translatedText = data.responseData.translatedText;
            if (translatedText === cleanText) {
                return "Text có thể đã là tiếng Việt hoặc không cần dịch";
            }
            return translatedText;
        }

        throw new Error("API không trả về kết quả dịch");
    } catch (error) {
        throw new Error(`Lỗi dịch: ${error.message}`);
    }
}
