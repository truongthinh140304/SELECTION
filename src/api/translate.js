/**
 * Hàm dịch text sang tiếng Việt
 * Hiện tại sử dụng MyMemory API (miễn phí)
 * Có thể thay đổi sang Google Translate, DeepL, hoặc LibreTranslate
 * 
 * @param {string} text - Text cần dịch
 * @returns {Promise<string>} - Text đã dịch
 */
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

/**
 * Hàm này là placeholder để dễ dàng thay đổi sang API khác
 * 
 * Ví dụ thay đổi sang Google Translate API:
 * 
 * async function translateText(text) {
 *   const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY`;
 *   const response = await fetch(apiUrl, {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       q: text,
 *       target: 'vi',
 *       source: 'en'
 *     })
 *   });
 *   const data = await response.json();
 *   return data.data.translations[0].translatedText;
 * }
 * 
 * Hoặc sử dụng LibreTranslate:
 * 
 * async function translateText(text) {
 *   const apiUrl = `http://localhost:5000/translate`;
 *   const response = await fetch(apiUrl, {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       q: text,
 *       source: 'auto',
 *       target: 'vi'
 *     })
 *   });
 *   const data = await response.json();
 *   return data.translatedText;
 * }
 */
