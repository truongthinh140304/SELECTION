# Selection Translate & Wiki Extension

Chrome Extension để dịch, tra Wikipedia, tóm tắt & highlight text trên trang web.

🌟 **Miễn phí | Không quảng cáo | Mã nguồn mở**

## ✨ Tính năng

- 🌐 **Dịch** - Gemini API (bấm nút để dịch)
- 📖 **Wiki** - Wikipedia VI/EN (tự động fallback)
- 📄 **Tóm tắt** - Layout 2 cột, sub-tabs pill-shaped
- 🎨 **Highlight** - 6 màu, lưu persistent
- 📁 **Storage** - 3 kho lưu trữ riêng
- 🌙 **Dark mode** - Full support
- 🖱️ **Draggable** - Kéo thả popup

## 📥 Cài đặt

### 1. Load extension
```
1. chrome://extensions → Developer mode ON
2. Load unpacked → Chọn folder project
```

### 2. Test
```
1. Bôi đen text
2. Click icon TW
3. Chọn tab → Sử dụng
```

## 🎯 Hướng dẫn nhanh

### Dịch
1. Bôi đen text → Click icon TW
2. Tab "🌐 Dịch" → Click nút "Dịch"
3. Chờ 2-5s → Xem kết quả

### Wikipedia
1. Bôi đen từ khóa → Click icon
2. Tab "📖 Wiki"
3. Tự động tìm VI → Fallback EN

### Tóm tắt
1. Bôi đen text → Tab "📄 Tóm tắt"
2. Sub-tabs: "✓ Đoạn" (default) / "↔ Tất cả"
3. Layout 2 cột: gốc | tóm tắt
4. Nút: Copy, Lưu, Chia sẻ

### Highlight
1. Bôi đen text → Tab "🎨 Highlight"
2. Chọn màu (6 cái)
3. Click "Highlight" → Text được tô
4. Click text → Xóa highlight

### Storage
1. Tab "📁 Lưu trữ"
2. 3 tabs: Lưu trữ mới | URL đã lưu | Lưu linh tinh
3. Xem danh sách, xóa item

### Dark Mode
- Click nút 🌙 ở header → Tối

## 🏗️ Cấu trúc

```
src/
├── background/
│   ├── background.js       # Message router
│   ├── translate.js        # Gemini dịch
│   ├── summarize.js        # Gemini tóm tắt
│   ├── wiki.js             # Wikipedia search
│   ├── storage.js          # Storage CRUD
│   └── highlight-storage.js
└── content/
    ├── highlight-dom.js    # Highlight DOM trên trang
    ├── js/
    │   ├── state.js            # Biến dùng chung
    │   ├── selection.js        # Bôi đen, icon TW, bootstrap
    │   ├── popup-shell.js      # Popup, tab, kéo, dark mode
    │   ├── popup-template.js   # HTML popup
    │   ├── tab-translate.js
    │   ├── tab-wiki.js
    │   ├── tab-summarize.js
    │   ├── tab-storage.js
    │   ├── tab-highlight.js
    │   └── utils.js
    └── css/
        ├── content-popup-base.css
        ├── content-storage.css
        ├── content-highlight.css
        ├── content-summarize.css
        ├── content-translate.css
        └── content-dark.css
```

## 🔌 API

### Gemini (Dịch & Tóm tắt)
```
Endpoint: generativelanguage.googleapis.com
Models: gemini-1.5-flash (dịch), gemini-1.5-pro (tóm tắt)
API Key: có sẵn (test)
Retry: 3x với backoff (2s→4s→6s)
```

### Wikipedia
```
Search: vi.wikipedia.org/w/api.php
Summary: vi.wikipedia.org/api/rest_v1/page/summary/{title}
Fallback: VI → EN
```

### Chrome APIs
- `chrome.storage.local` - Storage
- `chrome.runtime.sendMessage` - Message passing
- `chrome.scripting` - DOM access

## ⚙️ Tùy chỉnh

### Thay API Key
**File:** `src/background/translate.js` & `summarize.js`
```javascript
const API_KEY = "YOUR_KEY";
```

**Lấy key:** https://aistudio.google.com/app/apikey

### Thay Model
```javascript
// translate.js
const model = "gemini-1.5-flash";

// summarize.js
const models = ["gemini-1.5-pro"];
```

### Thay Prompt
```javascript
const prompt = `Dịch sang tiếng Việt: ${text}`;
```

### Thêm tab mới
**`src/content/js/popup-template.js`** — thêm nút tab và pane trong `getPopupHtml()`.

**`src/content/js/popup-shell.js`** — xử lý trong `switchTab()`.

**`src/content/css/`** — style tab tương ứng (ví dụ `content-popup-base.css` hoặc file tab riêng).

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|----------|
| Extension không load | Kiểm tra manifest.json valid JSON |
| Icon TW không hiện | Reload trang, bôi đen text dài |
| Dịch không work | Kiểm tra Gemini API key |
| Wikipedia không tìm | Thử text khác, kiểm tra internet |
| Highlight không lưu | Kiểm tra localStorage enable |

**Debug:**
1. `chrome://extensions` → Service worker → Console
2. `F12` → Console (content script logs)

## 🔐 Bảo mật

- ✅ Dữ liệu lưu local (không cloud)
- ⚠️ API keys hardcoded (test mode)
- 🔒 Production: dùng backend proxy
- 🔒 Không share keys trên GitHub

## 📱 Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave, Opera
- ❌ Firefox, Safari

## 🚀 Performance

- Extension load: ~200ms
- Content inject: ~100ms
- API call: 2-5s
- Popup render: ~100ms

## 📚 Tài liệu

- [Chrome Ext Docs](https://developer.chrome.com/docs/extensions)
- [Gemini API](https://ai.google.dev)
- [Wikipedia API](https://en.wikipedia.org/w/api.php)

## 📝 License

MIT - Tự do sử dụng

## 🤝 Support

Gặp lỗi?
1. Xem FAQ ở trên
2. DevTools Console logs
3. Reload extension
4. GitHub Issues

---

**v2.0 | May 2026 | Made for Vietnamese users ❤️**


