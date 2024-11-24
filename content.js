chrome.storage.local.get(["activeHostnames", "settings"], (result) => {
  const hostname = window.location.hostname;
  if (result.activeHostnames && result.activeHostnames.includes(hostname)) {
    initializeFeatures(result.settings);
  }
});

function initializeFeatures(settings) {
  if (settings.copyProtection) {
    enableRightClickAndCopy();
    enableAbsoluteMode();
  }
  if (settings.alwaysActive) {
    keepTabActive();
  }
}

// Enable right-click and copy functionality
function enableRightClickAndCopy() {
  const events = [
    "contextmenu",
    "copy",
    "cut",
    "paste",
    "selectstart",
    "select",
    "keydown",
    "keyup",
  ];

  events.forEach((event) => {
    document.addEventListener(event, (e) => e.stopPropagation(), true);
  });

  const css = `
    *, *::before, *::after {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
    }

    input, textarea, button, select, a, .focusable {
        pointer-events: all !important;  /* Ensures input fields and buttons work */
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

// Absolute mode to remove event listeners that block copying
function enableAbsoluteMode() {
  const events = [
    "copy",
    "cut",
    "paste",
    "select",
    "selectstart",
    "contextmenu",
    "dragstart",
    "mousedown",
    "mouseup",
    "mousemove",
    "keydown",
    "keyup",
    "beforecopy",
    "beforecut",
    "beforepaste",
  ];

  events.forEach((event) => {
    window.addEventListener(event, preventEvent, true);
    document.addEventListener(event, preventEvent, true);
  });

  // Override Event.prototype.preventDefault
  const originalPreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function () {
    if (events.includes(this.type)) {
      return false;
    }
    return originalPreventDefault.apply(this, arguments);
  };
}

function preventEvent(e) {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement ||
    e.target instanceof HTMLButtonElement
  ) {
    return; // Allow events on focusable elements
  }
  e.stopPropagation(); // Prevent other events
}

// Keep the tab active by overriding visibility properties and events
function keepTabActive() {
  Object.defineProperty(document, "visibilityState", {
    get: () => "visible",
    configurable: true,
  });

  Object.defineProperty(document, "hidden", {
    get: () => false,
    configurable: true,
  });

  const visibilityEvents = [
    "visibilitychange",
    "webkitvisibilitychange",
    "mozvisibilitychange",
    "mouseenter",
    "mouseleave",
    "focusin",
    "focusout",
    "focus",
    "blur",
  ];

  visibilityEvents.forEach((event) => {
    document.addEventListener(event, (e) => e.stopImmediatePropagation(), true);
  });

  // Ensure requestAnimationFrame keeps running
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    return originalRequestAnimationFrame(function (timestamp) {
      callback(timestamp);
      window.requestAnimationFrame(callback);
    });
  };
}

// Monitor input fields and ensure focusability
function monitorInputFields() {
  const observer = new MutationObserver(() => {
    const focusableElements = document.querySelectorAll(
      "input, textarea, button, select, a"
    );
    focusableElements.forEach((element) => {
      element.style.pointerEvents = "auto"; // Ensure they're not blocked
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
}

monitorInputFields();

// Handle messages from popup or background scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSettings") {
    initializeFeatures(message.settings);
    sendResponse({ success: true });
  } else if (message.action === "keepAlive") {
    sendResponse({ status: "alive" });
  }
});

// Update context menu with selected text
document.addEventListener("contextmenu", () => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: "updateContextMenu",
      selectedText: selectedText,
    });
  }
});

// Start features immediately
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    initializeFeatures(defaultSettings())
  );
} else {
  initializeFeatures(defaultSettings());
}

// Default settings in case storage is not ready
function defaultSettings() {
  return {
    copyProtection: true,
    alwaysActive: true,
  };
}
