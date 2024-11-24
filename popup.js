// Get the active tab's hostname and settings
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// Initialize the popup's state
async function initializePopup() {
  const tab = await getCurrentTab();
  const hostname = new URL(tab.url).hostname;

  const result = await chrome.storage.local.get([
    "activeHostnames",
    "settings",
  ]);
  const activeHostnames = new Set(result.activeHostnames || []);
  const settings = result.settings || {
    copyProtection: false,
    alwaysActive: false,
  };

  // Update the UI with the stored settings
  document.getElementById("copyProtection").checked = settings.copyProtection;
  document.getElementById("alwaysActive").checked =
    activeHostnames.has(hostname);

  const statusElement = document.getElementById("status");
  if (activeHostnames.has(hostname)) {
    statusElement.textContent = "Active";
    statusElement.className = "active";
  } else {
    statusElement.textContent = "Inactive";
    statusElement.className = "inactive";
  }
}

// Handle toggling features
async function handleToggle(feature) {
  const tab = await getCurrentTab();
  const hostname = new URL(tab.url).hostname;

  const result = await chrome.storage.local.get([
    "activeHostnames",
    "settings",
  ]);
  const activeHostnames = new Set(result.activeHostnames || []);
  const settings = result.settings || {};

  if (feature === "alwaysActive") {
    // Manage activeHostnames based on checkbox state
    if (document.getElementById("alwaysActive").checked) {
      activeHostnames.add(hostname);
    } else {
      activeHostnames.delete(hostname);
    }
    await chrome.storage.local.set({
      activeHostnames: Array.from(activeHostnames),
    });
  } else {
    settings[feature] = document.getElementById(feature).checked;
    await chrome.storage.local.set({
      activeHostnames: Array.from(activeHostnames),
      settings,
    });
  }

  // Update status
  const statusElement = document.getElementById("status");
  if (activeHostnames.has(hostname)) {
    statusElement.textContent = "Active";
    statusElement.className = "active";
  } else {
    statusElement.textContent = "Inactive";
    statusElement.className = "inactive";
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getCurrentTab();
  const hostname = new URL(tab.url).hostname;

  const result = await chrome.storage.local.get([
    "activeHostnames",
    "settings",
  ]);
  const activeHostnames = new Set(result.activeHostnames || []);
  const settings = result.settings || {
    copyProtection: false,
  };

  // Update the UI with the stored settings
  document.getElementById("copyProtection").checked = settings.copyProtection;
  document.getElementById("alwaysActive").checked =
    activeHostnames.has(hostname);

  const statusElement = document.getElementById("status");
  if (activeHostnames.has(hostname)) {
    statusElement.textContent = "Active";
    statusElement.className = "active";
  } else {
    statusElement.textContent = "Inactive";
    statusElement.className = "inactive";
  }
});

// Handle toggling features
document
  .getElementById("copyProtection")
  .addEventListener("change", () => handleToggle("copyProtection"));
document
  .getElementById("alwaysActive")
  .addEventListener("change", () => handleToggle("alwaysActive"));
