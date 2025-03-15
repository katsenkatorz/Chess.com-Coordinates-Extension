// Chess.com Coordinates Extension
// Script that displays chess square coordinates on chess.com with hover effect

(function() {
    'use strict';
    
    // Configuration
    const MAX_RETRIES = 20;
    const RETRY_INTERVAL = 500; // ms
    let retryCount = 0;
    let currentBoardOrientation = false; // false = standard (white at bottom), true = flipped (black at bottom)
    let currentCoordinatesVisible = true; // Track if coordinates are currently visible
    let hideOriginalCoordinates = true; // Track if original Chess.com coordinates should be hidden
    
    // Function to calculate appropriate font size based on board size
    function calculateFontSize(chessBoard) {
        if (!chessBoard) return 'min(8.5vw, 8.5vh)';
        
        const boardRect = chessBoard.getBoundingClientRect();
        const squareSize = boardRect.width / 8; // Size of one square
        
        // Return a font size that's proportional to the square size
        // This ensures the text always fits nicely within a square
        return `${squareSize * 1.3}px`;
    }
    
    // Function to update font size of all coordinate labels
    function updateCoordinateFontSizes() {
        const chessBoard = document.querySelector('wc-chess-board');
        if (!chessBoard) return;
        
        const fontSize = calculateFontSize(chessBoard);
        const labels = document.querySelectorAll('.coordinate-label');
        
        labels.forEach(label => {
            label.style.fontSize = fontSize;
        });
    }
    
    // Function to set up resize handlers for responsive font sizing
    function setupResizeHandlers(chessBoard) {
        if (!chessBoard) return;
        
        // Add window resize event listener to update font sizes
        window.addEventListener('resize', function() {
            updateCoordinateFontSizes();
        });
        
        // Also update font sizes when the board is resized (for responsive layouts)
        const resizeObserver = new ResizeObserver(function() {
            updateCoordinateFontSizes();
        });
        
        resizeObserver.observe(chessBoard);
    }
    
    // Function to toggle visibility of original coordinates
    function toggleOriginalCoordinates(show) {
        // Target the SVG coordinates element that contains the original Chess.com coordinates
        const originalCoordinatesSvg = document.querySelectorAll('wc-chess-board svg.coordinates');
        originalCoordinatesSvg.forEach(svg => {
            svg.style.display = show ? 'block' : 'none';
        });
        
        // Also target individual coordinate text elements if they exist
        const originalCoordinateTexts = document.querySelectorAll('wc-chess-board svg.coordinates text');
        originalCoordinateTexts.forEach(text => {
            text.style.display = show ? 'block' : 'none';
        });
    }
    
    // Function to determine if the board is flipped (black at bottom)
    function isBoardFlipped(chessBoard) {
        if (chessBoard.hasAttribute('flipped') || 
            chessBoard.classList.contains('flipped') || 
            chessBoard.getAttribute('orientation') === 'black') {
            return true;
        }
        
        // Additional check for the presence of black pieces at the bottom
        const pieces = chessBoard.querySelectorAll('.piece');
        if (pieces.length > 0) {
            // Look for kings' positions
            let whiteKingRow = -1;
            let blackKingRow = -1;
            
            pieces.forEach(piece => {
                const pieceClass = piece.getAttribute('class');
                const style = window.getComputedStyle(piece);
                const transform = style.getPropertyValue('transform');
                
                // Extract position from transform matrix
                const matrix = transform.match(/matrix.*\((.+)\)/);
                if (matrix) {
                    const values = matrix[1].split(', ');
                    const translateY = parseFloat(values[5]);
                    const row = Math.round(translateY / (chessBoard.offsetHeight / 8));
                    
                    if (pieceClass.includes('wk')) {
                        whiteKingRow = row;
                    } else if (pieceClass.includes('bk')) {
                        blackKingRow = row;
                    }
                }
            });
            
            // If white king is in the top half and black king is in the bottom half, board is flipped
            if (whiteKingRow >= 0 && blackKingRow >= 0) {
                return whiteKingRow < 4 && blackKingRow >= 4;
            }
        }
        
        return false;
    }
    
    // Function to add coordinate labels to the chessboard
    function addCoordinateLabels() {
        const chessBoard = document.querySelector('wc-chess-board');
        if (!chessBoard) {
            console.error("Chessboard not found");
            return false;
        }
        
        console.log("Chessboard found! Adding coordinates...");
        
        // Remove any existing labels
        const existingContainer = document.querySelector('.coordinate-labels-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        const existingLabels = document.querySelectorAll('.coordinate-label');
        existingLabels.forEach(label => label.remove());
        
        // Hide original coordinates
        toggleOriginalCoordinates(false);
        
        // Create container for our custom labels
        const labelsContainer = document.createElement('div');
        labelsContainer.className = 'coordinate-labels-container';
        labelsContainer.style.position = 'absolute';
        labelsContainer.style.top = '0';
        labelsContainer.style.left = '0';
        labelsContainer.style.width = '100%';
        labelsContainer.style.height = '100%';
        labelsContainer.style.pointerEvents = 'none'; // To not interfere with clicks
        labelsContainer.style.zIndex = '-10'; // Negative z-index to stay behind pieces
        labelsContainer.style.display = 'block'; // Ensure coordinates are visible by default
        
        // Get board dimensions
        const boardRect = chessBoard.getBoundingClientRect();
        const squareSize = boardRect.width / 8; // Size of one square (the board is square)
        
        // Determine board orientation using our isBoardFlipped function
        const isFlipped = isBoardFlipped(chessBoard);
        
        console.log(`Detected orientation: ${isFlipped ? "Black at bottom (flipped)" : "White at bottom (standard)"}`);
        
        // Create labels for each square
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Standard algebraic notation (independent of orientation)
                // - row 0 (top) = 8, row 7 (bottom) = 1
                // - column 0 (left) = a, column 7 (right) = h
                
                // Determine physical position on the chessboard based on orientation
                let physicalRow, physicalCol;
                
                if (!isFlipped) {
                    // Standard orientation (white at bottom)
                    physicalRow = row;
                    physicalCol = col;
                } else {
                    // Flipped orientation (black at bottom)
                    // In this case, we invert the physical coordinates
                    physicalRow = 7 - row;
                    physicalCol = 7 - col;
                }
                
                // Convert to standard algebraic notation (always the same regardless of orientation)
                const file = String.fromCharCode(97 + col).toUpperCase(); // A-H
                const rank = 8 - row; // 8-1
                const algebraic = file + rank;
                
                // Create the label
                const label = document.createElement('div');
                label.className = 'coordinate-label';
                label.textContent = algebraic;
                label.dataset.algebraic = algebraic; // Store algebraic notation for reference
                label.style.position = 'absolute';
                label.style.fontFamily = 'Impact, Charcoal, sans-serif'; // Impact font
                label.style.fontSize = calculateFontSize(chessBoard); // Dynamic font size based on board size
                label.style.fontWeight = 'normal'; // Impact is already bold
                label.style.color = 'rgba(0, 0, 0, 0.06)'; // Very transparent text
                label.style.backgroundColor = 'transparent'; // No background
                label.style.width = '12.5%'; // Width of one square
                label.style.height = '12.5%'; // Height of one square
                label.style.display = 'flex';
                label.style.justifyContent = 'center'; // Center horizontally
                label.style.alignItems = 'center'; // Center vertically
                label.style.boxSizing = 'border-box';
                label.style.overflow = 'hidden'; // Hide text overflow
                label.style.zIndex = '-10'; // Negative z-index to stay behind pieces
                label.style.transition = 'color 0.3s ease'; // Smooth transition for color change
                
                // Position the label based on board orientation
                // We use physical coordinates for positioning
                const left = (physicalCol / 8) * 100;
                const top = (physicalRow / 8) * 100;
                
                label.style.left = `${left}%`;
                label.style.top = `${top}%`;
                
                labelsContainer.appendChild(label);
            }
        }
        
        // Insert labels before pieces to ensure they are below
        // Find the first child element of the board
        const firstChild = chessBoard.firstChild;
        if (firstChild) {
            chessBoard.insertBefore(labelsContainer, firstChild);
        } else {
            chessBoard.appendChild(labelsContainer);
        }
        
        // Ensure the container is visible
        labelsContainer.style.display = currentCoordinatesVisible ? 'block' : 'none';
        
        // Hide original coordinates
        toggleOriginalCoordinates(!currentCoordinatesVisible);
        
        console.log("Square coordinates added successfully!");
        
        return true;
    }
    
    // Function to handle square hover effect
    function setupHoverEffect() {
        const chessBoard = document.querySelector('wc-chess-board');
        if (!chessBoard) return;
        
        // Add event listener for mouse movement
        chessBoard.addEventListener('mousemove', function(e) {
            // Get board dimensions
            const rect = chessBoard.getBoundingClientRect();
            const squareSize = rect.width / 8;
            
            // Calculate mouse position relative to the board
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Determine the hovered square's physical position
            const physicalCol = Math.floor(x / squareSize);
            const physicalRow = Math.floor(y / squareSize);
            
            // Select all labels
            const labels = document.querySelectorAll('.coordinate-label');
            
            // Reset all labels to their normal opacity
            labels.forEach(label => {
                label.style.color = 'rgba(0, 0, 0, 0.06)';
            });
            
            // Find the label corresponding to the hovered square
            if (physicalCol >= 0 && physicalCol < 8 && physicalRow >= 0 && physicalRow < 8) {
                // Calculate the expected position values
                const targetLeftValue = (physicalCol / 8) * 100;
                const targetTopValue = (physicalRow / 8) * 100;
                
                // Find the label at this position by comparing numeric values
                let found = false;
                for (let i = 0; i < labels.length; i++) {
                    const label = labels[i];
                    
                    // Extract numeric values from style strings (remove '%' and convert to number)
                    const labelLeft = parseFloat(label.style.left);
                    const labelTop = parseFloat(label.style.top);
                    
                    // Compare with a small tolerance to account for floating point precision
                    if (Math.abs(labelLeft - targetLeftValue) < 0.1 && 
                        Math.abs(labelTop - targetTopValue) < 0.1) {
                        label.style.color = 'rgba(0, 0, 0, 0.3)';
                        found = true;
                        break;
                    }
                }
            }
        });
        
        // Reset when mouse leaves the board
        chessBoard.addEventListener('mouseleave', function() {
            const labels = document.querySelectorAll('.coordinate-label');
            labels.forEach(label => {
                label.style.color = 'rgba(0, 0, 0, 0.06)';
            });
        });
    }
    
    // Function to toggle coordinate visibility
    function toggleCoordinatesVisibility(show) {
        const container = document.querySelector('.coordinate-labels-container');
        if (container) {
            container.style.display = show ? 'block' : 'none';
            
            // Show/hide original coordinates based on hideOriginalCoordinates setting
            toggleOriginalCoordinates(!hideOriginalCoordinates);
        } else if (show) {
            // If container doesn't exist but we want to show coordinates, create them
            addCoordinateLabels();
        }
        
        // Save state to local variable
        currentCoordinatesVisible = show;
    }
    
    // Function to observe board orientation changes
    function setupBoardOrientationObserver() {
        // Keep track of the current board orientation
        const chessBoard = document.querySelector('wc-chess-board');
        if (!chessBoard) return;
        
        currentBoardOrientation = isBoardFlipped(chessBoard);
        
        // Create a MutationObserver to detect changes in the DOM
        const domObserver = new MutationObserver(function(mutations) {
            setTimeout(() => {
                const chessBoard = document.querySelector('wc-chess-board');
                if (!chessBoard) return;
                
                const newOrientation = isBoardFlipped(chessBoard);
                
                if (newOrientation !== currentBoardOrientation) {
                    console.log(`Orientation change after DOM mutation: ${newOrientation ? 'Flipped' : 'Standard'}`);
                    
                    currentBoardOrientation = newOrientation;
                    
                    addCoordinateLabels();
                    setupHoverEffect();
                }
            }, 200);
        });
        
        // Observe the entire document for changes
        domObserver.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: true
        });
    }
    
    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'toggleCoordinates') {
            toggleCoordinatesVisibility(message.show);
            sendResponse({ success: true });
        } else if (message.action === 'toggleOriginalCoordinates') {
            hideOriginalCoordinates = message.hide;
            toggleOriginalCoordinates(!hideOriginalCoordinates);
            sendResponse({ success: true });
        }
        return true; // Indicate we want to send a response asynchronously
    });
    
    // Main initialization function
    function init() {
        console.log("Initializing chess coordinates extension...");
        
        // Check stored visibility preferences
        chrome.storage.sync.get(['showCoordinates', 'hideOriginalCoordinates'], function(result) {
            // Default to true if not set
            currentCoordinatesVisible = result.showCoordinates !== undefined ? result.showCoordinates : true;
            hideOriginalCoordinates = result.hideOriginalCoordinates !== undefined ? result.hideOriginalCoordinates : true;
            
            // Try to find the chessboard immediately
            const initialChessBoard = document.querySelector('wc-chess-board');
            
            if (initialChessBoard) {
                console.log("Chessboard found on initial load!");
                // Chessboard is already in the DOM, add coordinates immediately
                addCoordinateLabels();
                setupHoverEffect();
                setupBoardOrientationObserver();
                setupResizeHandlers(initialChessBoard);
                
                // Apply the hideOriginalCoordinates setting immediately
                toggleOriginalCoordinates(!hideOriginalCoordinates);
            } else {
                console.log("Chessboard not found on initial load, waiting...");
                // Set up a polling mechanism to find the chessboard
                let attempts = 0;
                const maxAttempts = 20;
                const pollInterval = 500; // 500ms
                
                const pollForChessboard = function() {
                    const chessBoard = document.querySelector('wc-chess-board');
                    
                    if (chessBoard) {
                        console.log(`Chessboard found after ${attempts} attempts!`);
                        addCoordinateLabels();
                        setupHoverEffect();
                        setupBoardOrientationObserver();
                        setupResizeHandlers(chessBoard);
                        
                        // Apply the hideOriginalCoordinates setting
                        toggleOriginalCoordinates(!hideOriginalCoordinates);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        console.log(`Polling for chessboard (${attempts}/${maxAttempts})...`);
                        setTimeout(pollForChessboard, pollInterval);
                    } else {
                        console.warn(`Failed to find chessboard after ${maxAttempts} attempts.`);
                    }
                };
                
                // Start polling
                pollForChessboard();
                
                // Also set up a mutation observer as a backup
                const observer = new MutationObserver(function(mutations) {
                    if (document.querySelector('wc-chess-board')) {
                        console.log("Chessboard found via mutation observer!");
                        observer.disconnect();
                        const chessBoard = document.querySelector('wc-chess-board');
                        addCoordinateLabels();
                        setupHoverEffect();
                        setupBoardOrientationObserver();
                        setupResizeHandlers(chessBoard);
                    }
                });
                
                // Observe changes in the body
                observer.observe(document.body, { childList: true, subtree: true });
                
                // Set maximum timeout for the observer
                setTimeout(function() {
                    observer.disconnect();
                }, 30000); // 30 seconds max
            }
        });
    }
    
    // Start initialization when the content script is loaded
    init();
    
    // Expose reset function globally for debugging
    window.reinitChessCoordinates = function() {
        retryCount = 0;
        init();
    };
    
    console.log("Chess coordinates extension loaded successfully. Use window.reinitChessCoordinates() to reset if needed.");
})();
