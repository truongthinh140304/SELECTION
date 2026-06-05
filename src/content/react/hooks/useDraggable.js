import { useEffect } from "react";

/**
 * Kéo thả popup — logic giống popup-shell.js setupPopupDrag
 */
export function useDraggable(containerRef, position, setPosition) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const header = container.querySelector(".selection-popup-draggable");
        if (!header) return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        const onMouseDown = (e) => {
            if (e.target.closest(".selection-popup-close-btn")) {
                return;
            }

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = container.offsetLeft;
            initialTop = container.offsetTop;
            header.style.cursor = "grabbing";
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - container.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - container.offsetHeight));

            setPosition({ left: newLeft, top: newTop });
        };

        const onMouseUp = () => {
            if (isDragging) {
                header.style.cursor = "grab";
            }
            isDragging = false;
        };

        header.style.cursor = "grab";
        header.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            header.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [containerRef, setPosition]);
}

export function getInitialPopupPosition() {
    const maxWidth = 400;
    return {
        left: (window.innerWidth - maxWidth) / 2,
        top: 60
    };
}
