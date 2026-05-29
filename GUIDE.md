# 🚀 Hướng dẫn Cài đặt & Sử dụng Extension

## Cài đặt (2 phút)

1. **Mở trình duyệt** → `chrome://extensions` (hoặc `edge://extensions`)
2. **Bật Developer mode** (góc trên phải)
3. **Click "Load unpacked"** → Chọn thư mục dự án → OK

Extension sẽ hiển thị trong danh sách.

## Test Tính Năng

**Bôi đen text bất kỳ trên website** → Icon sẽ xuất hiện → Click icon:
- **Tab "Dịch"**: Dịch text sang tiếng Việt
- **Tab "Wiki"**: Lấy thông tin từ Wikipedia

## Debug

- **Content log**: Nhấn F12 trên website → Console
- **Background log**: `chrome://extensions` → Click "Service worker"
- **Reload**: `chrome://extensions` → Click icon reload

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|----------|
| Icon không xuất hiện | Reload extension, F5 refresh trang |
| Popup không mở | Kiểm tra console (F12), reload extension |
| Dịch/Wiki không hoạt động | Kiểm tra internet, xem log background |
| Lỗi "Could not load the extension" | Kiểm tra manifest.json (valid JSON?), tất cả file có tồn tại? |

---

# 🎯 Cấu hình Gemini API (Tóm tắt)

## Lấy API Key (30 giây)

1. Vào [Google AI Studio](https://makersuite.google.com/app/apikeys)
2. Click **"Create API Key"**
3. Copy key

## Thêm vào Extension

1. Mở `src/background/summarize.js`
2. Tìm: `const GEMINI_API_KEY = ""`
3. Sửa thành: `const GEMINI_API_KEY = "YOUR_KEY_HERE"`
4. Lưu file
5. Reload extension (`chrome://extensions` → click reload)

## Test

Bôi đen text → Click icon → Tab "Tóm tắt" → Click "Tóm tắt đoạn" hoặc "Tóm tắt tất cả"

## Lỗi?

| Lỗi | Nguyên nhân | Sửa |
|-----|-----------|-----|
| "Chưa cấu hình Gemini API key" | Chưa thêm key vào summarize.js | Thêm key rồi reload |
| "API key không hợp lệ" | Key sai/hết hạn | Lấy key mới từ Google AI Studio |
| "Quota exceeded" | Vượt giới hạn miễn phí | Chờ 24h hoặc nâng cấp |
| "Tóm tắt quá lâu" | Trang dài, API xử lý lâu | Bình thường, chỉ cần chờ |

## FAQ

**Q: Cần internet không?** A: Có, gọi API external.  
**Q: Dịch sang ngôn ngữ khác được không?** A: Có, sửa `langpair=en|vi` trong `src/background/translate.js`.  
**Q: Data gửi đâu?** A: Text → MyMemory/Wikipedia API. Highlight & storage lưu local.

---

Chúc bạn thành công! 🎉
