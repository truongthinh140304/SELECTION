/**
 * Tóm tắt text sử dụng Gemini API.
 */

const GEMINI_API_KEY = "AIzaSyA94EmqFLSsSbsYrkSkIW0PLqdu9qsSNcA"; // TODO: Thêm API key của bạn từ https://makersuite.google.com/app/apikeys

const GEMINI_MODELS = ["gemini-3.1-flash-lite"];

/**
 * Tóm tắt đoạn text được bôi đen
 */
async function summarizeSelection(text) {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error("Chưa cấu hình Gemini API key. Vui lòng thêm API key vào summarize.js");
        }

        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        const prompt = `Hãy tóm tắt đoạn text sau thành 2-3 câu ngắn gọn, dễ hiểu:\n\n${cleanText}`;

        return await callGeminiApi(prompt);
    } catch (error) {
        throw new Error(`Lỗi tóm tắt: ${error.message}`);
    }
}

/**
 * Tóm tắt toàn bộ nội dung trang
 */
async function summarizeFullPage() {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error("Chưa cấu hình Gemini API key. Vui lòng thêm API key vào summarize.js");
        }

        // Lấy nội dung text từ trang thông qua content script
        // Sẽ được xử lý thông qua message passing từ content script
        throw new Error("Vui lòng gọi từ content script với nội dung trang");
    } catch (error) {
        throw new Error(`Lỗi tóm tắt trang: ${error.message}`);
    }
}

/**
 * Tóm tắt nội dung dài bất kỳ
 */
async function summarizeContent(text) {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error("Chưa cấu hình Gemini API key. Vui lòng thêm API key vào summarize.js");
        }

        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        const prompt = `Hãy tóm tắt nội dung sau một cách ngắn gọn và dễ hiểu, giữ lại những điểm chính quan trọng.\n\nĐịnh dạng kết quả như sau:\n- Mỗi điểm chính trên một dòng riêng\n- Tách các phần bằng một dòng trống\n- Dùng bullet point (-) hoặc số (1.) để liệt kê\n\nNội dung cần tóm tắt:\n${cleanText}`;

        return await callGeminiApi(prompt);
    } catch (error) {
        throw new Error(`Lỗi tóm tắt: ${error.message}`);
    }
}

async function callGeminiApi(prompt) {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            return await callGeminiModel(model, prompt);
        } catch (error) {
            lastError = error;
            if (!isRetryableGeminiError(error)) {
                throw error;
            }
        }
    }

    throw lastError || new Error("Không thể kết nối Gemini API");
}

async function callGeminiModel(model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
        throw new Error(formatGeminiError(apiMessage, response.status));
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
        return text;
    }

    throw new Error("Không nhận được kết quả từ Gemini API");
}

function isRetryableGeminiError(error) {
    const msg = error.message || "";
    return (
        msg.includes("quota") ||
        msg.includes("Quota") ||
        msg.includes("429") ||
        msg.includes("not found") ||
        msg.includes("NOT_FOUND")
    );
}

function formatGeminiError(apiMessage, status) {
    if (status === 429 || /quota|rate.?limit/i.test(apiMessage)) {
        const retryMatch = apiMessage.match(/retry in ([\d.]+)s/i);
        const waitHint = retryMatch ? ` Thử lại sau khoảng ${Math.ceil(Number(retryMatch[1]))} giây.` : " Thử lại sau vài phút.";
        return `Đã hết hạn mức miễn phí của Gemini API.${waitHint} Xem thêm: https://ai.google.dev/gemini-api/docs/rate-limits`;
    }

    if (apiMessage.length > 200) {
        return apiMessage.split("\n")[0];
    }

    return apiMessage;
}
