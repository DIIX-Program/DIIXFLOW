"use strict";
/**
 * Muse AI (Hatch) Multi-Tier Selector Registry
 * Provides resilient fallbacks for DOM elements across UI revisions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELECTOR_REGISTRY = void 0;
exports.queryFirst = queryFirst;
exports.queryAll = queryAll;
exports.SELECTOR_REGISTRY = {
    // Composer Root
    composerRoot: [
        '[data-hatch-composer-root]',
        'form:has(textarea)',
        '[role="region"][aria-label*="composer" i]',
        'footer:has(textarea)',
    ],
    // Prompt Editor
    promptEditor: [
        '[data-hatch-composer-root] textarea',
        '[data-lexical-editor="true"]',
        '[contenteditable="true"][role="textbox"]',
        'textarea[placeholder]',
    ],
    // File Input (Up to 9 reference images)
    fileInput: [
        '[data-hatch-composer-root] input[type="file"]',
        'input[type="file"]',
    ],
    // Submit Button
    submitButton: [
        '[data-hatch-composer-root] button[type="submit"]',
        '[data-testid="hatch-composer-send-button"]',
        'button[aria-label*="Send" i]',
        'button[aria-label*="Generate" i]',
    ],
    // Stop / Streaming Button (visible while generating)
    stopButton: [
        '[data-testid="hatch-composer-stop-button"]',
        'button[aria-label*="Stop" i]',
        'button[aria-label*="Dừng" i]',
    ],
    // Message Items
    messageItem: [
        '[data-message-item]',
        '[role="listitem"][data-message-role]',
    ],
    // Assistant Response Error Notice
    errorNotice: [
        '[data-testid="assistant-response-error-notice"]',
        '[role="alert"]',
    ],
};
function queryFirst(selectors, context = document) {
    for (const selector of selectors) {
        try {
            const el = context.querySelector(selector);
            if (el)
                return el;
        }
        catch { }
    }
    return null;
}
function queryAll(selectors, context = document) {
    for (const selector of selectors) {
        try {
            const list = context.querySelectorAll(selector);
            if (list.length > 0)
                return Array.from(list);
        }
        catch { }
    }
    return [];
}
