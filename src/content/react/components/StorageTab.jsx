import { useCallback, useEffect, useState } from "react";
import { sendChromeMessage } from "../hooks/useChromeMessage.js";
import { ErrorMessage, Loading, SafeHtml } from "./shared.jsx";

function formatArchivePageUrl(url) {
    if (!url) return "";
    return url.length > 55 ? `${url.substring(0, 55)}...` : url;
}

function buildArchivePageOpenUrl(pageUrl, searchText) {
    if (!pageUrl) return "";
    try {
        const url = new URL(pageUrl);
        const snippet = (searchText || "").trim().replace(/\s+/g, " ").slice(0, 120);
        if (snippet) {
            url.hash = `:~:text=${encodeURIComponent(snippet)}`;
        }
        return url.href;
    } catch {
        return pageUrl;
    }
}

function ArchiveItem({ item, onDelete }) {
    const savedDate = new Date(item.savedAt).toLocaleString("vi-VN");

    return (
        <div className="selection-popup-archive-item" data-item-id={item.id}>
            <SafeHtml className="selection-popup-archive-item-text" text={item.text} />
            {item.translatedText ? (
                <SafeHtml className="selection-popup-archive-item-translation" text={item.translatedText} />
            ) : null}
            {item.pageUrl ? (
                <div className="selection-popup-archive-item-page">
                    <a
                        href={item.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="selection-popup-archive-item-page-link"
                        title={item.pageTitle || item.pageUrl}
                    >
                        🔗 {formatArchivePageUrl(item.pageUrl)}
                    </a>
                    <button
                        type="button"
                        className="selection-popup-archive-page-search-btn"
                        data-page-url={item.pageUrl}
                        data-search-text={item.text || ""}
                        onClick={() =>
                            window.open(
                                buildArchivePageOpenUrl(item.pageUrl, item.text),
                                "_blank",
                                "noopener,noreferrer"
                            )
                        }
                    >
                        🔍 Mở trang
                    </button>
                </div>
            ) : null}
            <div className="selection-popup-archive-item-meta">
                <span className="selection-popup-archive-item-date">{savedDate}</span>
                <button
                    type="button"
                    className="selection-popup-archive-delete-btn"
                    data-item-id={item.id}
                    onClick={() => onDelete(item.id)}
                >
                    ❌ Xóa
                </button>
            </div>
        </div>
    );
}

export function StorageTab({ isActive, selectedText, translationData, onArchiveSaved }) {
    const [subTab, setSubTab] = useState("new");
    const [saveState, setSaveState] = useState("idle");
    const [saveUrlState, setSaveUrlState] = useState("idle");
    const [archivePhase, setArchivePhase] = useState("idle");
    const [archiveItems, setArchiveItems] = useState([]);
    const [archiveError, setArchiveError] = useState("");
    const [urlPhase, setUrlPhase] = useState("idle");
    const [urlItems, setUrlItems] = useState([]);
    const [urlError, setUrlError] = useState("");
    const [removingUrlIds, setRemovingUrlIds] = useState([]);

    useEffect(() => {
        if (!isActive) return;
        setSubTab("new");
    }, [isActive]);

    const loadArchive = useCallback(async () => {
        setArchivePhase("loading");
        setArchiveError("");

        const response = await sendChromeMessage({ action: "getArchiveItems" });

        if (response?.success && Array.isArray(response.items)) {
            setArchiveItems(response.items);
            setArchivePhase("result");
        } else {
            setArchiveError(response?.error || "Không thể tải kho lưu trữ");
            setArchivePhase("error");
        }
    }, []);

    const loadUrlArchive = useCallback(async () => {
        setUrlPhase("loading");
        setUrlError("");

        const response = await sendChromeMessage({ action: "getUrlArchiveItems" });

        if (response?.success && Array.isArray(response.items)) {
            setUrlItems(response.items);
            setUrlPhase("result");
        } else {
            setUrlError(response?.error || "Không thể tải danh sách URL");
            setUrlPhase("error");
        }
    }, []);

    useEffect(() => {
        if (!isActive || subTab !== "archive") return;
        loadArchive();
    }, [isActive, subTab, loadArchive]);

    useEffect(() => {
        if (!isActive || subTab !== "url-archive") return;
        loadUrlArchive();
    }, [isActive, subTab, loadUrlArchive]);

    const handleSaveToArchive = async () => {
        const archiveItem = {
            text: selectedText,
            translatedText: translationData?.translatedText || "",
            wikipediaInfo: translationData?.wikipediaInfo || null,
            pageUrl: window.location.href,
            pageTitle: document.title
        };

        const response = await sendChromeMessage({ action: "saveArchive", item: archiveItem });

        if (response?.connectionFailed) {
            alert("❌ Lỗi kết nối extension. Hãy reload extension tại chrome://extensions");
            return;
        }

        if (!response?.success) {
            alert(`❌ Lỗi lưu: ${response?.error || "Vui lòng thử lại"}`);
            return;
        }

        setSaveState("success");
        setTimeout(() => setSaveState("idle"), 2000);

        if (subTab === "archive") {
            loadArchive();
        }
        onArchiveSaved?.();
    };

    const handleSaveUrlToArchive = async () => {
        const response = await sendChromeMessage({
            action: "saveUrlArchive",
            title: document.title,
            url: window.location.href
        });

        if (response?.connectionFailed) {
            alert("❌ Lỗi kết nối extension. Hãy reload extension tại chrome://extensions");
            return;
        }

        if (!response?.success) {
            alert(`❌ ${response?.error || "Không thể lưu URL"}`);
            return;
        }

        setSaveUrlState("success");
        setTimeout(() => setSaveUrlState("idle"), 2000);
    };

    const handleDeleteArchiveItem = async (itemId) => {
        if (!confirm("Bạn chắc chắn muốn xóa item này?")) {
            return;
        }

        const response = await sendChromeMessage({ action: "deleteArchiveItem", id: itemId });

        if (response?.success) {
            setArchiveItems((items) => items.filter((item) => item.id !== itemId));
        } else {
            alert(`❌ Lỗi xóa: ${response?.error || "Vui lòng thử lại"}`);
        }
    };

    const handleDeleteUrlArchiveItem = async (itemId) => {
        if (!confirm("Bạn chắc chắn muốn xóa URL này?")) {
            return;
        }

        const response = await sendChromeMessage({ action: "deleteUrlArchiveItem", id: itemId });

        if (response?.success) {
            setRemovingUrlIds((ids) => [...ids, itemId]);
            setTimeout(() => {
                setUrlItems((items) => items.filter((item) => item.id !== itemId));
                setRemovingUrlIds((ids) => ids.filter((id) => id !== itemId));
            }, 300);
        } else {
            alert(`❌ ${response?.error || "Không thể xóa URL"}`);
        }
    };

    if (!isActive) {
        return <div className="selection-popup-tab-pane" data-pane="storage"></div>;
    }

    return (
        <div className="selection-popup-tab-pane active" data-pane="storage">
            <div className="selection-popup-storage-tabs">
                <button
                    type="button"
                    className={`selection-popup-storage-tab-btn${subTab === "new" ? " active" : ""}`}
                    data-storage-tab="new"
                    onClick={() => setSubTab("new")}
                >
                    Lưu trữ mới
                </button>
                <button
                    type="button"
                    className={`selection-popup-storage-tab-btn${subTab === "url-archive" ? " active" : ""}`}
                    data-storage-tab="url-archive"
                    onClick={() => setSubTab("url-archive")}
                >
                    URL đã lưu
                </button>
                <button
                    type="button"
                    className={`selection-popup-storage-tab-btn${subTab === "archive" ? " active" : ""}`}
                    data-storage-tab="archive"
                    onClick={() => setSubTab("archive")}
                >
                    Lưu linh tinh
                </button>
            </div>

            <div
                className={`selection-popup-storage-pane${subTab === "new" ? " active" : ""}`}
                data-storage-pane="new"
            >
                <div className="selection-popup-storage-new">
                    <p className="selection-popup-storage-info">Nhấn nút bên dưới để lưu từng này vào kho</p>
                    <div className="selection-popup-button-group">
                        <button
                            type="button"
                            className="selection-popup-save-btn"
                            onClick={handleSaveToArchive}
                            disabled={saveState === "success"}
                        >
                            {saveState === "success" ? "✅ Đã lưu!" : "Lưu từng này"}
                        </button>
                        <button
                            type="button"
                            className="selection-popup-save-url-btn"
                            onClick={handleSaveUrlToArchive}
                            disabled={saveUrlState === "success"}
                        >
                            {saveUrlState === "success" ? "✅ Đã lưu URL!" : "Lưu URL trang này"}
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`selection-popup-storage-pane${subTab === "url-archive" ? " active" : ""}`}
                data-storage-pane="url-archive"
            >
                {urlPhase === "loading" && <Loading>Đang tải...</Loading>}
                {urlPhase === "error" && <ErrorMessage message={urlError} />}
                {urlPhase === "result" && urlItems.length === 0 && (
                    <div className="selection-popup-archive-empty">Chưa có URL nào được lưu</div>
                )}
                {urlPhase === "result" && urlItems.length > 0 && (
                    <div className="selection-popup-url-archive-list">
                        {urlItems.map((item) => (
                            <div
                                key={item.id}
                                className="selection-popup-url-archive-item"
                                data-item-id={item.id}
                                style={
                                    removingUrlIds.includes(item.id)
                                        ? { opacity: 0, transform: "translateX(-20px)", transition: "0.3s" }
                                        : undefined
                                }
                            >
                                <SafeHtml
                                    className="selection-popup-url-archive-item-title"
                                    text={item.title}
                                />
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="selection-popup-url-archive-item-link"
                                >
                                    🔗 {item.url.substring(0, 50)}
                                    {item.url.length > 50 ? "..." : ""}
                                </a>
                                <div className="selection-popup-url-archive-item-meta">
                                    <span className="selection-popup-url-archive-item-date">
                                        {new Date(item.savedAt).toLocaleString("vi-VN")}
                                    </span>
                                    <button
                                        type="button"
                                        className="selection-popup-url-archive-delete-btn"
                                        data-item-id={item.id}
                                        onClick={() => handleDeleteUrlArchiveItem(item.id)}
                                    >
                                        ❌ Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div
                className={`selection-popup-storage-pane${subTab === "archive" ? " active" : ""}`}
                data-storage-pane="archive"
            >
                {archivePhase === "loading" && <Loading>Đang tải...</Loading>}
                {archivePhase === "error" && <ErrorMessage message={archiveError} />}
                {archivePhase === "result" && archiveItems.length === 0 && (
                    <div className="selection-popup-archive-empty">Kho lưu trữ trống rỗng</div>
                )}
                {archivePhase === "result" && archiveItems.length > 0 && (
                    <div className="selection-popup-archive-list">
                        {archiveItems.map((item) => (
                            <ArchiveItem key={item.id} item={item} onDelete={handleDeleteArchiveItem} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
