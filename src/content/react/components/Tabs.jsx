const MAIN_TABS = [
    { id: "translate", label: "Dịch", icon: "🌐" },
    { id: "wiki", label: "Wiki", icon: "📖" },
    { id: "summarize", label: "Tóm tắt", icon: "📄" },
    { id: "highlight", label: "Highlight", icon: "🎨" },
    { id: "storage", label: "Lưu trữ", icon: "📁" }
];

export function Tabs({ activeTab, onTabChange }) {
    return (
        <div className="selection-popup-tabs">
            {MAIN_TABS.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    className={`selection-popup-tab-btn${activeTab === tab.id ? " active" : ""}`}
                    data-tab={tab.id}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span>{tab.icon}</span> {tab.label}
                </button>
            ))}
        </div>
    );
}
