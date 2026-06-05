import { useCallback, useEffect, useState } from "react";

/**
 * Bôi đen text, icon TW, click outside — logic từ selection.js
 */
export function useSelection() {
    const [selectedText, setSelectedText] = useState("");
    const [iconPosition, setIconPosition] = useState(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [suppressSelectionHide, setSuppressSelectionHide] = useState(false);
    const [ignoreNextOutsideClick, setIgnoreNextOutsideClick] = useState(false);

    const hideIcon = useCallback(() => {
        setIconPosition(null);
    }, []);

    const showIcon = useCallback(() => {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setIconPosition({ left: rect.right + 8, top: rect.top - 5 });
    }, []);

    const handleTextSelection = useCallback(
        (event) => {
            if (popupOpen) return;

            const target = event?.target;
            if (
                target?.closest?.(".selection-popup-icon") ||
                target?.closest?.(".selection-popup-container")
            ) {
                return;
            }

            const text = window.getSelection().toString().trim();
            setSelectedText(text);

            if (text.length > 0) {
                showIcon();
            } else if (!suppressSelectionHide) {
                hideIcon();
            }
        },
        [popupOpen, suppressSelectionHide, showIcon, hideIcon]
    );

    const handleSelectionChange = useCallback(() => {
        if (suppressSelectionHide || popupOpen) return;

        if (window.getSelection().toString().trim().length === 0) {
            hideIcon();
        }
    }, [popupOpen, suppressSelectionHide, hideIcon]);

    const handleClickOutside = useCallback(
        (event) => {
            if (!popupOpen) return;
            if (ignoreNextOutsideClick) {
                setIgnoreNextOutsideClick(false);
                return;
            }

            if (event.target.closest?.(".selection-popup-icon")) return;
            if (event.target.closest?.(".selection-popup-container")) return;

            setPopupOpen(false);
        },
        [popupOpen, ignoreNextOutsideClick]
    );

    const openPopup = useCallback(() => {
        setSuppressSelectionHide(true);
        setIgnoreNextOutsideClick(true);
        setPopupOpen(true);
        setIconPosition(null);
        requestAnimationFrame(() => {
            setSuppressSelectionHide(false);
        });
    }, []);

    const closePopup = useCallback(() => {
        setPopupOpen(false);
        if (!selectedText) {
            hideIcon();
        }
    }, [selectedText, hideIcon]);

    useEffect(() => {
        document.addEventListener("mouseup", handleTextSelection);
        document.addEventListener("touchend", handleTextSelection);
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("selectionchange", handleSelectionChange);

        return () => {
            document.removeEventListener("mouseup", handleTextSelection);
            document.removeEventListener("touchend", handleTextSelection);
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("selectionchange", handleSelectionChange);
        };
    }, [handleTextSelection, handleClickOutside, handleSelectionChange]);

    return {
        selectedText,
        iconPosition,
        popupOpen,
        openPopup,
        closePopup
    };
}
