/**
 * Muse AI (Hatch) Multi-Tier Selector Registry
 * Provides resilient fallbacks for DOM elements across UI revisions.
 */

export const SELECTOR_REGISTRY = {
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

export function queryFirst<T extends Element = HTMLElement>(selectors: string[], context: ParentNode = document): T | null {
  for (const selector of selectors) {
    try {
      const el = context.querySelector<T>(selector);
      if (el) return el;
    } catch {}
  }
  return null;
}

export function queryAll<T extends Element = HTMLElement>(selectors: string[], context: ParentNode = document): T[] {
  for (const selector of selectors) {
    try {
      const list = context.querySelectorAll<T>(selector);
      if (list.length > 0) return Array.from(list);
    } catch {}
  }
  return [];
}
