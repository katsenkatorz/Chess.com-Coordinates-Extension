// Popup script for Chess.com Coordinates Extension

document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('coordinates-toggle');
  const hideOriginalToggle = document.getElementById('hide-original-toggle');
  const hoverEffectToggle = document.getElementById('hover-effect-toggle');
  const showOnHoverToggle = document.getElementById('show-on-hover-toggle');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');
  
  // Retrieve the current states from storage
  chrome.storage.sync.get(['showCoordinates', 'hideOriginalCoordinates', 'enableHoverEffect', 'showOnlyOnHover', 'fontSizePercentage', 'coordinateOpacity'], function(result) {
    // Default to true if not set
    const showCoordinates = result.showCoordinates !== undefined ? result.showCoordinates : true;
    toggleSwitch.checked = showCoordinates;
    
    // Default to true for hiding original coordinates
    const hideOriginalCoordinates = result.hideOriginalCoordinates !== undefined ? result.hideOriginalCoordinates : true;
    hideOriginalToggle.checked = hideOriginalCoordinates;
    
    // Default to true for show only on hover
    const showOnlyOnHover = result.showOnlyOnHover !== undefined ? result.showOnlyOnHover : true;
    showOnHoverToggle.checked = showOnlyOnHover;
    
    // Default to true for hover effect
    // If showOnlyOnHover is true, hover effect must be enabled
    const enableHoverEffect = showOnlyOnHover ? true : (result.enableHoverEffect !== undefined ? result.enableHoverEffect : true);
    hoverEffectToggle.checked = enableHoverEffect;
    
    // Update hover effect toggle appearance
    updateHoverEffectToggle(showOnlyOnHover);
    
    // Default to 100% for font size
    const fontSizePercentage = result.fontSizePercentage !== undefined ? result.fontSizePercentage : 100;
    fontSizeSlider.value = fontSizePercentage;
    fontSizeValue.textContent = fontSizePercentage + '%';
    
    // Default to 0.06 (6%) for opacity
    const opacityPercentage = result.coordinateOpacity !== undefined ? Math.round(result.coordinateOpacity * 100) : 6;
    opacitySlider.value = opacityPercentage;
    opacityValue.textContent = opacityPercentage + '%';
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
  
  // Function to update hover effect toggle state and appearance
  function updateHoverEffectToggle(showOnlyOnHover) {
    // Get the container element of the hover effect toggle
    const hoverEffectContainer = hoverEffectToggle.closest('.toggle-container');
    
    // If showOnlyOnHover is true, hover effect must be enabled and disabled as a control
    if (showOnlyOnHover) {
      hoverEffectToggle.checked = true;
      hoverEffectToggle.disabled = true;
      // Add readonly class to container for visual indication
      hoverEffectContainer.classList.add('readonly');
      // Change cursor to indicate it's not clickable
      hoverEffectContainer.style.cursor = 'not-allowed';
    } else {
      hoverEffectToggle.disabled = false;
      // Remove readonly class
      hoverEffectContainer.classList.remove('readonly');
      // Reset cursor
      hoverEffectContainer.style.cursor = '';
    }
  }
  
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
  
  // Add event listener for show only on hover toggle switch
  showOnHoverToggle.addEventListener('change', function() {
    const showOnlyOnHover = showOnHoverToggle.checked;
    
    // If showOnlyOnHover is enabled, we must enable hover effect
    if (showOnlyOnHover && !hoverEffectToggle.checked) {
      hoverEffectToggle.checked = true;
      
      // Save hover effect state to storage
      chrome.storage.sync.set({ enableHoverEffect: true });
      
      // Send message to content script to enable hover effect
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url.includes('chess.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'toggleHoverEffect', 
            enable: true 
          });
        }
      });
    }
    
    // Update hover effect toggle appearance
    updateHoverEffectToggle(showOnlyOnHover);
    
    // Save state to storage
    chrome.storage.sync.set({ showOnlyOnHover: showOnlyOnHover });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('chess.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'toggleShowOnlyOnHover', 
          enable: showOnlyOnHover 
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
  
  // Add event listener for opacity slider
  opacitySlider.addEventListener('input', function() {
    const opacityPercentage = parseInt(opacitySlider.value);
    opacityValue.textContent = opacityPercentage + '%';
    
    // Convert percentage to decimal for actual opacity value (e.g., 6% -> 0.06)
    const opacityDecimal = opacityPercentage / 100;
    
    // Calculate hover opacity (5x normal opacity, but max 0.5)
    const hoverOpacityDecimal = Math.min(opacityDecimal * 5, 0.5);
    
    // Save state to storage
    chrome.storage.sync.set({ 
      coordinateOpacity: opacityDecimal,
      hoverOpacity: hoverOpacityDecimal
    });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('chess.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateOpacity', 
          opacity: opacityDecimal,
          hoverOpacity: hoverOpacityDecimal
        });
      }
    });
  });
});
