/**
 * Popup shell HTML template.
 */

function getPopupHtml() {
    return `
    <div class="selection-popup-header selection-popup-draggable">
      <h3 class="selection-popup-title">Translate & Wiki</h3>
      <div class="selection-popup-header-buttons">
        <button class="selection-popup-theme-toggle-btn" title="Toggle dark mode">🌙</button>
        <button class="selection-popup-close-btn">&times;</button>
      </div>
    </div>
    
    <div class="selection-popup-tabs">
      <button class="selection-popup-tab-btn active" data-tab="translate"><span>🌐</span> Dịch</button>
      <button class="selection-popup-tab-btn" data-tab="wiki"><span>📖</span> Wiki</button>
      <button class="selection-popup-tab-btn" data-tab="summarize"><span>📄</span> Tóm tắt</button>
      <button class="selection-popup-tab-btn" data-tab="highlight"><span>🎨</span> Highlight</button>
      <button class="selection-popup-tab-btn" data-tab="storage"><span>📁</span> Lưu trữ</button>
    </div>
    
    <div class="selection-popup-content">
      <div class="selection-popup-selected-text">${escapeHtml(selectedText)}</div>
      
      <div class="selection-popup-tab-pane active" data-pane="translate">
        <div class="selection-popup-loading">
          <span class="selection-popup-spinner"></span>
          Đang dịch...
        </div>
      </div>
      
      <div class="selection-popup-tab-pane" data-pane="wiki">
        <div class="selection-popup-loading">
          <span class="selection-popup-spinner"></span>
          Đang tìm kiếm...
        </div>
      </div>
      
      <div class="selection-popup-tab-pane" data-pane="summarize">
        <div class="selection-popup-summarize-tabs">
          <button class="selection-popup-summarize-tab-btn active" data-summarize-tab="selection">Tóm tắt đoạn</button>
          <button class="selection-popup-summarize-tab-btn" data-summarize-tab="fullpage">Tóm tắt tất cả</button>
        </div>
        
        <div class="selection-popup-summarize-pane active" data-summarize-pane="selection">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tóm tắt...
          </div>
        </div>
        
        <div class="selection-popup-summarize-pane" data-summarize-pane="fullpage">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tóm tắt...
          </div>
        </div>
      </div>
      
      <div class="selection-popup-tab-pane" data-pane="storage">
        <div class="selection-popup-storage-tabs">
          <button class="selection-popup-storage-tab-btn active" data-storage-tab="new">Lưu trữ mới</button>
          <button class="selection-popup-storage-tab-btn" data-storage-tab="url-archive">URL đã lưu</button>
          <button class="selection-popup-storage-tab-btn" data-storage-tab="archive">Lưu linh tinh</button>
        </div>
        
        <div class="selection-popup-storage-pane active" data-storage-pane="new">
          <div class="selection-popup-storage-new">
            <p class="selection-popup-storage-info">Nhấn nút bên dưới để lưu từng này vào kho</p>
            <div class="selection-popup-button-group">
              <button class="selection-popup-save-btn">Lưu từng này</button>
              <button class="selection-popup-save-url-btn">Lưu URL trang này</button>
            </div>
          </div>
        </div>
        
        <div class="selection-popup-storage-pane" data-storage-pane="url-archive">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tải...
          </div>
        </div>
        
        <div class="selection-popup-storage-pane" data-storage-pane="archive">
          <div class="selection-popup-loading">
            <span class="selection-popup-spinner"></span>
            Đang tải...
          </div>
        </div>
      </div>

      <div class="selection-popup-tab-pane" data-pane="highlight">
        <div class="selection-popup-highlight-content">
          <p class="selection-popup-highlight-label">Chọn màu highlight:</p>
          <div class="selection-popup-color-picker">
            <button class="selection-popup-color-btn" data-color="#FFFF00" title="Vàng" style="background-color: #FFFF00"></button>
            <button class="selection-popup-color-btn" data-color="#FF6B6B" title="Đỏ" style="background-color: #FF6B6B"></button>
            <button class="selection-popup-color-btn" data-color="#4ECDC4" title="Xanh nhạt" style="background-color: #4ECDC4"></button>
            <button class="selection-popup-color-btn" data-color="#95E1D3" title="Xanh lá" style="background-color: #95E1D3"></button>
            <button class="selection-popup-color-btn" data-color="#FFB6D9" title="Hồng" style="background-color: #FFB6D9"></button>
            <button class="selection-popup-color-btn" data-color="#C7CEEA" title="Tím" style="background-color: #C7CEEA"></button>
          </div>
          <button class="selection-popup-highlight-apply-btn">Highlight text này</button>
          <p class="selection-popup-highlight-hint">Tip: Di chuột vào highlight để xóa</p>
        </div>
      </div>    
    </div>
  `;
}
