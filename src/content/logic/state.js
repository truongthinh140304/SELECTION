/**
 * Shared state for content scripts (global scope).
 */

let selectedText = "";
let popupIcon = null;
let popupContainer = null;
let suppressSelectionHide = false;
let ignoreNextOutsideClick = false;
let currentTranslationData = null;
let selectedHighlightColor = "#FFFF00";
