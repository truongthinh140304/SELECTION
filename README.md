# Selection Translate & Wiki Extension

Chrome Extension Manifest V3 để dịch và tra Wikipedia khi bôi đen text trên trang web.

## Tính năng

✨ **Dịch** - Dịch text sang tiếng Việt  
📖 **Wiki** - Tra Wikipedia (tiếng Việt trước, sau đó tiếng Anh)  
🎯 **Popup nhỏ gọn** - Hiện ngay trên trang không làm phiền user  
⚡ **Loading state** - Hiển thị spinner khi đang xử lý  
🛡️ **Error handling** - Xử lý lỗi API gracefully  

## Cấu trúc Project

```
selection-translate-wiki-extension/
├── manifest.json           # Manifest V3
├── src/
│   ├── content.js          # Content script (chạy trên trang web)
│   ├── content.css         # Style cho popup
│   ├── background.js       # Service worker background
│   └── api/
│       ├── translate.js    # Logic dịch (optional)
│       └── wiki.js         # Logic Wikipedia (optional)
├── assets/
│   ├── icon-16.svg
│   ├── icon-48.svg
│   └── icon-128.svg
└── README.md              # File này
```

## Cách sử dụng

### 1. Clone/Download project

```bash
git clone <repo-url> selection-translate-wiki-extension
cd selection-translate-wiki-extension
```

### 2. Load extension vào Chrome

1. Mở **chrome://extensions**
2. Bật **Developer mode** (góc trên bên phải)
3. Click **Load unpacked**
4. Chọn thư mục `selection-translate-wiki-extension`

### 3. Test extension

1. Mở website bất kỳ (ví dụ: https://wikipedia.org)
2. **Bôi đen một đoạn text** bất kỳ
3. **Icon 🔧** sẽ xuất hiện cạnh text
4. **Click icon** để mở popup
5. Chọn tab **"Dịch"** hoặc **"Wiki"** để sử dụng

## Hành động từng bước

### Ví dụ: Dịch từ "REST API"

1. Bôi đen text "REST API" trên trang
2. Icon 🔧 xuất hiện bên cạnh
3. Click icon → Popup mở
4. Tab "Dịch" đang active, loading...
5. Kết quả dịch hiển thị: "API REST"
6. Click "Wiki" để tra Wikipedia về REST API

### Ví dụ: Tra Wikipedia "Machine Learning"

1. Bôi đen "Machine Learning"
2. Click icon
3. Click tab "Wiki"
4. Popup tìm kiếm Wikipedia:
   - Thử tiếng Việt trước (vi.wikipedia.org)
   - Nếu không tìm thấy, thử tiếng Anh (en.wikipedia.org)
5. Hiển thị: Tiêu đề, mô tả, link Wikipedia
6. Click link để đọc bài viết đầy đủ

## API được sử dụng

### 1. Dịch

Hiện tại sử dụng **MyMemory API** (miễn phí):
```
https://api.mymemory.translated.net/get?q=TEXT&langpair=en|vi
```

Có thể dễ dàng thay đổi sang:
- **Google Translate API** (cần API key)
- **DeepL API** (cần API key)
- **LibreTranslate** (tự host hoặc dùng public API)

Code được thiết kế để thay đổi hàm `translateText()` trong `src/background.js` dễ dàng.

### 2. Wikipedia

Sử dụng **Wikipedia API** chính thức:

**Search:**
```
https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=TEXT&format=json&origin=*
```

**Summary:**
```
https://vi.wikipedia.org/api/rest_v1/page/summary/TITLE
```

## File cấu hình

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Selection Translate & Wiki",
  "version": "1.0",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "https://vi.wikipedia.org/*",
    "https://en.wikipedia.org/*",
    "https://api.mymemory.translated.net/*"
  ]
}
```

## Công nghệ

- **Vanilla JavaScript** - Không dùng framework
- **Chrome Extension API** - Manifest V3
- **CSS3** - Animations và styling
- **REST API** - Gọi API từ background script

## Xử lý lỗi

- ✅ API timeout hoặc fail → Hiển thị error message
- ✅ Không tìm thấy kết quả → Message "Không tìm thấy"
- ✅ Text rỗng → Ẩn icon
- ✅ Popup click ra ngoài → Tự động đóng

## Thay đổi icon

File icon là SVG và có thể:

1. **Sửa file SVG** (`assets/icon-*.svg`)
2. **Convert SVG thành PNG** (dùng online converter)
3. **Sửa manifest.json** nếu thay đổi tên file

## Debug

Để debug extension:

1. Mở **chrome://extensions**
2. Tìm "Selection Translate & Wiki"
3. Click **"Service worker"** để xem console của background
4. Mở website, bôi đen text
5. Mở **DevTools (F12)** của trang web → **Console** để xem log từ content script

## Lưu ý

- Extension chỉ hoạt động trên trang HTTP/HTTPS
- Không hoạt động trên `chrome://*`, `edge://*`, hoặc các trang đặc biệt
- API Wikipedia có rate limit, tránh request quá nhanh
- MyMemory API là miễn phí nhưng có thể bị rate limit

## Mở rộng

Bạn có thể mở rộng extension:

1. **Thêm ngôn ngữ dịch** - Sửa `langpair` trong `translateText()`
2. **Thêm tính năng** - Thêm tab mới trong popup
3. **Lưu lịch sử** - Dùng `chrome.storage.local`
4. **Custom API** - Thay đổi endpoint trong background.js

## License

MIT - Sử dụng tự do

## Hỗ trợ

Nếu gặp lỗi:
- Kiểm tra console (F12 → Console)
- Kiểm tra manifest.json có valid JSON không
- Reload extension (chrome://extensions)
- Kiểm tra host_permissions trong manifest.json
