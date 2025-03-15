// Background script for Chess.com Coordinates Extension

// Function to update the extension icon based on the current URL
function updateIcon(tabId, url) {
  // Check if the URL is from chess.com
  const isChessSite = url && url.includes('chess.com');
  
  // Set the appropriate icon
  chrome.action.setIcon({
    path: isChessSite ? {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png"
    } : {
      16: "icons/icon16-disabled.png",
      48: "icons/icon48-disabled.png",
      128: "icons/icon128-disabled.png"
    },
    tabId: tabId
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      updateIcon(tab.tabId, tab.url);
    }
  });
});

// Initialize icons for all tabs when the extension is loaded
chrome.tabs.query({}, (tabs) => {
  for (const tab of tabs) {
    updateIcon(tab.id, tab.url);
  }
});
