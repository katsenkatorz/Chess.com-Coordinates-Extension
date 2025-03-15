// Popup script for Chess.com Coordinates Extension

document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('coordinates-toggle');
  
  // Retrieve the current state from storage
  chrome.storage.sync.get(['showCoordinates'], function(result) {
    // Default to true if not set
    const showCoordinates = result.showCoordinates !== undefined ? result.showCoordinates : true;
    toggleSwitch.checked = showCoordinates;
  });
  
  // Add event listener for toggle switch
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
});
