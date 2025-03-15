// Popup script for Chess.com Coordinates Extension

document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('coordinates-toggle');
  const hideOriginalToggle = document.getElementById('hide-original-toggle');
  const hoverEffectToggle = document.getElementById('hover-effect-toggle');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  
  // Retrieve the current states from storage
  chrome.storage.sync.get(['showCoordinates', 'hideOriginalCoordinates', 'enableHoverEffect', 'fontSizePercentage'], function(result) {
    // Default to true if not set
    const showCoordinates = result.showCoordinates !== undefined ? result.showCoordinates : true;
    toggleSwitch.checked = showCoordinates;
    
    // Default to true for hiding original coordinates
    const hideOriginalCoordinates = result.hideOriginalCoordinates !== undefined ? result.hideOriginalCoordinates : true;
    hideOriginalToggle.checked = hideOriginalCoordinates;
    
    // Default to true for hover effect
    const enableHoverEffect = result.enableHoverEffect !== undefined ? result.enableHoverEffect : true;
    hoverEffectToggle.checked = enableHoverEffect;
    
    // Default to 100% for font size
    const fontSizePercentage = result.fontSizePercentage !== undefined ? result.fontSizePercentage : 100;
    fontSizeSlider.value = fontSizePercentage;
    fontSizeValue.textContent = fontSizePercentage + '%';
  });
  
  // Add event listener for extension coordinates toggle switch
  toggleSwitch.addEventListener('change', function() {
    const showCoordinates = toggleSwitch.checked;
    
    // Save state to storage
    chrome.storage.sync.set({ showCoordinates: showCoordinates });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('chess.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'toggleCoordinates', 
          show: showCoordinates 
        });
      }
    });
  });
  
  // Add event listener for hiding original coordinates toggle switch
  hideOriginalToggle.addEventListener('change', function() {
    const hideOriginalCoordinates = hideOriginalToggle.checked;
    
    // Save state to storage
    chrome.storage.sync.set({ hideOriginalCoordinates: hideOriginalCoordinates });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('chess.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'toggleOriginalCoordinates', 
          hide: hideOriginalCoordinates 
        });
      }
    });
  });
  
  // Add event listener for hover effect toggle switch
  hoverEffectToggle.addEventListener('change', function() {
    const enableHoverEffect = hoverEffectToggle.checked;
    
    // Save state to storage
    chrome.storage.sync.set({ enableHoverEffect: enableHoverEffect });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('chess.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'toggleHoverEffect', 
          enable: enableHoverEffect 
        });
      }
    });
  });
  
  // Add event listener for font size slider
  fontSizeSlider.addEventListener('input', function() {
    const fontSizePercentage = parseInt(fontSizeSlider.value);
    fontSizeValue.textContent = fontSizePercentage + '%';
    
    // Save state to storage
    chrome.storage.sync.set({ fontSizePercentage: fontSizePercentage });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('chess.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateFontSize', 
          percentage: fontSizePercentage 
        });
      }
    });
  });
});
