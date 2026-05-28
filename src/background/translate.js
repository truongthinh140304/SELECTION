/**
 * Dịch text sang tiếng Việt qua MyMemory API.
 * API giới hạn 500 byte/request — text dài được chia nhỏ rồi ghép lại.
 */

const MAX_CHUNK_BYTES = 500;

async function translateText(text) {
    try {
        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error("Text rỗng");
        }

        const chunks = splitIntoChunks(cleanText, MAX_CHUNK_BYTES);
        const translatedParts = [];

        for (let i = 0; i < chunks.length; i++) {
            if (i > 0) {
                // Delay 2 giây giữa các request để tránh 429 rate limit
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            translatedParts.push(await translateChunk(chunks[i]));
        }

        return translatedParts.join(" ");
    } catch (error) {
        throw new Error(`Lỗi dịch: ${error.message}`);
    }
}

async function translateChunk(text) {
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi&de=truongthinhng19@gmail.com`;

    let lastError;
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                if (response.status === 429 && attempt < 5) {
                    // Rate limit - chờ lâu hơn và thử lại
                    const waitTime = Math.min(3000 * attempt, 15000); // Max 15 seconds
                    console.warn(`Rate limit (429), thử lại lần ${attempt}/5 sau ${waitTime}ms`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const status = Number(data.responseStatus);

            if (status === 200) {
                const translatedText = data.responseData.translatedText;
                if (translatedText === text) {
                    return text;
                }
                return translatedText;
            }

            const detail = data.responseDetails || data.responseData?.translatedText || "";
            if (/quota|limit exceeded/i.test(detail)) {
                throw new Error("Đã hết hạn mức dịch miễn phí hôm nay (50000 ký tự/ngày). Thử lại vào ngày mai.");
            }

            throw new Error(detail || "API không trả về kết quả dịch");
        } catch (error) {
            lastError = error;
            if (attempt < 5 && error.message.includes("429")) {
                const waitTime = Math.min(3000 * attempt, 15000);
                console.warn(`Rate limit, thử lại sau ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            break;
        }
    }

    throw lastError || new Error("Không thể dịch sau 5 lần thử");
}

function splitIntoChunks(text, maxBytes) {
    if (getByteLength(text) <= maxBytes) {
        return [text];
    }

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (getByteLength(remaining) <= maxBytes) {
            chunks.push(remaining);
            break;
        }

        let cut = findMaxFitIndex(remaining, maxBytes);
        const breakAt = findWordBreak(remaining, cut);
        if (breakAt > 0) {
            cut = breakAt;
        }

        const piece = remaining.slice(0, cut).trimEnd();
        if (!piece) {
            throw new Error("Đoạn text quá dài hoặc chứa ký tự không hỗ trợ dịch");
        }

        chunks.push(piece);
        remaining = remaining.slice(cut).trimStart();
    }

    return chunks;
}

function findMaxFitIndex(text, maxBytes) {
    let low = 1;
    let high = text.length;
    let best = 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (getByteLength(text.slice(0, mid)) <= maxBytes) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return best;
}

function findWordBreak(text, maxIndex) {
    const slice = text.slice(0, maxIndex);
    const lastSpace = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
    return lastSpace > maxIndex * 0.4 ? lastSpace : 0;
}

function getByteLength(text) {
    return new TextEncoder().encode(text).length;
}
