# 🚀 Hướng dẫn chạy Extension

## Bước 1: Kiểm tra cấu trúc thư mục

Đảm bảo thư mục của bạn có cấu trúc như sau:

```
selection-translate-wiki-extension/
├── manifest.json
├── src/
│   ├── background/
│   │   ├── background.js
│   │   ├── storage.js
│   │   ├── highlight-storage.js
│   │   ├── translate.js
│   │   └── wiki.js
│   └── content/
│       ├── content.js
│       ├── content.css
│       └── highlight-dom.js
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

## Bước 2: Mở Chrome (hoặc Edge)

1. Mở trình duyệt Chrome hoặc Microsoft Edge
2. Gõ `chrome://extensions` hoặc `edge://extensions` vào thanh địa chỉ
3. Nhấn Enter

## Bước 3: Bật Developer Mode

- Tìm **Developer mode** ở góc trên bên phải của trang
- **Bật nó** (toggle sẽ chuyển sang màu xanh)

## Bước 4: Load Extension

1. Click nút **"Load unpacked"** (hoặc "Tải tiện ích chưa được đóng gói")
2. Chọn thư mục `selection-translate-wiki-extension`
3. Click "Select Folder"

## Bước 5: Xác nhận Extension được cài

Bạn sẽ thấy extension hiển thị trong danh sách:

```
[Icon] Selection Translate & Wiki
ID: (some long id)
Version: 1.0
Enabled ✓
```

## Bước 6: Test Extension

### Test trên bất kỳ website nào

1. Mở website bất kỳ (ví dụ: https://www.wikipedia.org)
2. **Bôi đen một đoạn text** (ví dụ: "Python programming")
3. **Icon 🔧** sẽ xuất hiện cạnh text được bôi đen
4. **Click icon** → Popup sẽ mở
5. Tab **"Dịch"** sẽ hoạt động mặc định
   - Bạn sẽ thấy loading spinner
   - Sau vài giây, kết quả dịch sẽ hiển thị
6. **Click tab "Wiki"**
   - Loading spinner hiển thị
   - Sau vài giây, thông tin Wikipedia sẽ hiển thị
   - Bạn có thể click link để đọc bài viết đầy đủ

### Test từng tính năng

**Test Dịch:**
```
1. Bôi đen: "Hello World"
2. Click icon
3. Kết quả: "Xin chào thế giới"
```

**Test Wiki (tiếng Việt):**
```
1. Bôi đen: "Trí tuệ nhân tạo"
2. Click icon
3. Click tab "Wiki"
4. Kết quả: Thông tin về AI từ Wikipedia tiếng Việt
```

**Test Wiki (tiếng Anh nếu Việt không có):**
```
1. Bôi đen: "Kubernetes"
2. Click icon
3. Click tab "Wiki"
4. Kết quả: Thông tin từ Wikipedia tiếng Anh (vì Việt có thể không có)
```

## Bước 7: Xem Log & Debug

### Xem log từ Content Script

1. Mở website
2. Bôi đen text để trigger icon
3. Nhấn **F12** để mở Developer Tools
4. Vào tab **Console**
5. Bạn sẽ thấy các log như:
   ```
   Selection Translate & Wiki - Content script loaded
   Text được bôi đen: REST API
   Background received message: translate
   ```

### Xem log từ Background Service Worker

1. Mở `chrome://extensions`
2. Tìm "Selection Translate & Wiki"
3. Click **"Service worker"** (link trong mô tả extension)
4. DevTools sẽ mở với console của background
5. Bôi đen text trên website, bạn sẽ thấy các log

## Bước 8: Reload Extension (nếu sửa code)

Nếu bạn sửa file code:

1. Mở `chrome://extensions`
2. Tìm "Selection Translate & Wiki"
3. Click icon **reload** (hình tròn với mũi tên)
4. Extension sẽ reload
5. Mở lại website và test

## Troubleshooting

### Problem 1: Icon không xuất hiện khi bôi đen text

**Giải pháp:**
- Reload extension (click icon reload trên extensions page)
- Refresh trang web (F5)
- Kiểm tra console xem có error không
- Tìm host_permissions trong manifest.json

### Problem 2: Popup không mở khi click icon

**Giải pháp:**
- Kiểm tra console (F12 → Console)
- Reload extension
- Kiểm tra content.js có tồn tại không

### Problem 3: Dịch hoặc Wiki không hoạt động

**Giải pháp:**
- Kiểm tra kết nối internet
- Click "Service worker" để xem log từ background
- Có thể API bị rate limit - chờ một chút rồi thử lại
- Kiểm tra host_permissions trong manifest.json

### Problem 4: "Could not load the extension"

**Giải pháp:**
- Kiểm tra manifest.json có valid JSON không (dùng jsonlint.com)
- Kiểm tra tất cả file tồn tại
- Không có lỗi cú pháp trong JavaScript files

### Problem 5: "Manifest version 3 is required"

**Giải pháp:**
- Đảm bảo manifest.json có dòng:
  ```json
  "manifest_version": 3
  ```

## Test trên Edge (Microsoft Edge)

Các bước tương tự:

1. Mở `edge://extensions`
2. Bật "Developer mode"
3. Click "Load unpacked"
4. Chọn thư mục extension

## Gỡ cài đặt Extension

Nếu muốn gỡ cài đặt:

1. Mở `chrome://extensions`
2. Tìm "Selection Translate & Wiki"
3. Click nút **Remove** (thùng rác)
4. Xác nhận

## Các Website hay để test

- https://en.wikipedia.org (có nhiều text để bôi đen)
- https://github.com (code documentation)
- https://developer.mozilla.org (technical articles)
- https://medium.com (bài viết)
- Bất kỳ blog hay trang tin nào có text

## Mẹo

💡 **Mẹo 1:** Click ra ngoài popup để đóng nó  
💡 **Mẹo 2:** Bôi đen text khác sẽ di chuyển icon  
💡 **Mẹo 3:** Bỏ chọn text (click vào trang) sẽ ẩn icon  
💡 **Mẹo 4:** Popup tự động thích ứng vị trí để không tràn ra ngoài  

## Hỏi đáp

**Q: Extension có hoạt động offline không?**  
A: Không, vì nó cần kết nối internet để gọi API Wikipedia và dịch.

**Q: Có thể dịch sang ngôn ngữ khác không?**  
A: Có, sửa `langpair=en|vi` trong `src/background/translate.js` thành ngôn ngữ khác.

**Q: Extension này có gửi dữ liệu ra ngoài không?**  
A: Có. Text được chọn sẽ được gửi tới MyMemory/Wikipedia khi bạn dùng tab Dịch/Wiki. Dữ liệu highlight và kho lưu trữ được lưu local bằng `chrome.storage.local`.

---

Chúc bạn thành công! 🎉
