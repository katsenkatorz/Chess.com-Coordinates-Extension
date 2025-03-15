// Chess.com coordinates display script
(function() {
    const MAX_RETRIES = 20;
    const RETRY_INTERVAL = 500; // ms
    let retryCount = 0;
    
    function toggleOriginalCoordinates(show) {
        const originalCoordinatesSvg = document.querySelector('svg.coordinates');
        if (originalCoordinatesSvg) {
            originalCoordinatesSvg.style.display = show ? 'block' : 'none';
        }
    }
    
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
        
        // The red grid has been removed as it's no longer needed
        
        // Get board dimensions
        const boardRect = chessBoard.getBoundingClientRect();
        const squareSize = boardRect.width / 8; // Size of one square (the board is square)
        
        // Create a complete 8x8 grid with correct coordinates
        // In standard chess notation:
        // - Columns are a-h (from left to right)
        // - Rows are 1-8 (from bottom to top)
        
        // Detect board orientation (white at bottom or black at bottom)
        // By examining the pieces, we can determine the orientation
        const whitePieces = chessBoard.querySelectorAll('.piece[class*="w"]');
        const blackPieces = chessBoard.querySelectorAll('.piece[class*="b"]');
        
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
                label.style.zIndex = '1000';
                label.style.fontFamily = 'Impact, Charcoal, sans-serif'; // Impact font
                label.style.fontSize = '8.5em'; // Larger size
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
        
        // The creation of the red grid has been removed as it's no longer needed
        
        // Insert labels before pieces to ensure they are below
        // Find the first child element of the board
        const firstChild = chessBoard.firstChild;
        if (firstChild) {
            chessBoard.insertBefore(labelsContainer, firstChild);
        } else {
            chessBoard.appendChild(labelsContainer);
        }
        
        // Ensure the container is visible
        labelsContainer.style.display = 'block';
        
        // Hide original coordinates
        toggleOriginalCoordinates(false);
        
        console.log("Square coordinates added successfully!");
        
        // Verify that coordinates are visible
        setTimeout(() => {
            const container = document.querySelector('.coordinate-labels-container');
            if (container && container.style.display !== 'block') {
                console.warn("Coordinates container is not visible, forcing display...");
                container.style.display = 'block';
            }
        }, 100);
        
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
                
                // Debug
                console.log(`Hovering at position: col=${physicalCol}, row=${physicalRow}`);
                console.log(`Looking for label at: left=${targetLeftValue}%, top=${targetTopValue}%`);
                
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
                
                if (!found) {
                    console.log('No matching label found at position');
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
    
    // Function to add the control button
    function addToggleButton() {
        // Remove existing button if it exists
        const existingButton = document.getElementById('chess-coordinates-toggle');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Create button to show/hide coordinates
        const toggleButton = document.createElement('button');
        toggleButton.id = 'chess-coordinates-toggle';
        toggleButton.textContent = 'Hide Coordinates';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '10000';
        toggleButton.style.padding = '8px';
        toggleButton.style.backgroundColor = '#4CAF50';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '4px';
        toggleButton.style.cursor = 'pointer';
        
        // Update button text based on initial state
        toggleButton.textContent = 'Hide Coordinates';
        
        toggleButton.addEventListener('click', function() {
            const container = document.querySelector('.coordinate-labels-container');
            if (container) {
                const newDisplay = container.style.display === 'none' ? 'block' : 'none';
                container.style.display = newDisplay;
                
                // Update button text based on state
                toggleButton.textContent = newDisplay === 'none' ? 'Show Coordinates' : 'Hide Coordinates';
                
                // Show/hide original coordinates based on our coordinates state
                toggleOriginalCoordinates(newDisplay === 'none');
            } else {
                addCoordinateLabels();
                toggleButton.textContent = 'Hide Coordinates';
            }
        });
        
        // Add button to document
        document.body.appendChild(toggleButton);
    }
    
    function isBoardFlipped(chessBoard) {
        if (chessBoard.hasAttribute('flipped') || 
            chessBoard.classList.contains('flipped') || 
            chessBoard.getAttribute('orientation') === 'black') {
            return true;
        }
        
        const whitePieces = chessBoard.querySelectorAll('.piece[class*="w"]');
        const blackPieces = chessBoard.querySelectorAll('.piece[class*="b"]');
        
        if (whitePieces.length > 0 && blackPieces.length > 0) {
            let whiteAvgY = 0;
            let blackAvgY = 0;
            
            whitePieces.forEach(piece => {
                whiteAvgY += piece.getBoundingClientRect().top;
            });
            whiteAvgY /= whitePieces.length;
            
            blackPieces.forEach(piece => {
                blackAvgY += piece.getBoundingClientRect().top;
            });
            blackAvgY /= blackPieces.length;
            
            return blackAvgY > whiteAvgY;
        }
        
        return false;
    }
    
    let currentBoardOrientation = false; // false = standard, true = flipped
    
    function setupBoardOrientationObserver() {
        const chessBoard = document.querySelector('wc-chess-board');
        if (!chessBoard) return;
        
        console.log("Setting up board orientation detection...");
        
        currentBoardOrientation = isBoardFlipped(chessBoard);
        console.log(`Initial board orientation: ${currentBoardOrientation ? 'Flipped' : 'Standard'}`);
        
        // 1. Periodic check of board orientation
        const orientationChecker = setInterval(() => {
            const chessBoard = document.querySelector('wc-chess-board');
            if (!chessBoard) return;
            
            const newOrientation = isBoardFlipped(chessBoard);
            
            if (newOrientation !== currentBoardOrientation) {
                console.log(`Orientation change detected: ${newOrientation ? 'Flipped' : 'Standard'}`);
                
                currentBoardOrientation = newOrientation;
                
                addCoordinateLabels();
                setupHoverEffect();
            }
        }, 500); // Check every 500ms
        
        // 2. Listen for all clicks on the document
        document.addEventListener('click', function(event) {
            setTimeout(() => {
                const chessBoard = document.querySelector('wc-chess-board');
                if (!chessBoard) return;
                
                const newOrientation = isBoardFlipped(chessBoard);
                
                if (newOrientation !== currentBoardOrientation) {
                    console.log(`Orientation change after click: ${newOrientation ? 'Flipped' : 'Standard'}`);
                    
                    currentBoardOrientation = newOrientation;
                    
                    addCoordinateLabels();
                    setupHoverEffect();
                }
            }, 200);
        }, true);
        
        // 3. Observe DOM changes
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
    
    function init() {
        console.log("Initializing chess coordinates script...");
        
        // Try to find the chessboard immediately
        const initialChessBoard = document.querySelector('wc-chess-board');
        
        if (initialChessBoard) {
            console.log("Chessboard found on initial load!");
            // Chessboard is already in the DOM, add coordinates immediately
            addCoordinateLabels();
            setupHoverEffect();
            addToggleButton();
            setupBoardOrientationObserver();
            
            // Force visibility of coordinates
            const container = document.querySelector('.coordinate-labels-container');
            if (container) {
                container.style.display = 'block';
                console.log("Coordinates container set to display: block");
            }
        } else {
            console.log("Chessboard not found on initial load, waiting...");
            // Set up a more aggressive polling mechanism to find the chessboard
            let attempts = 0;
            const maxAttempts = 20;
            const pollInterval = 500; // 500ms
            
            const pollForChessboard = function() {
                const chessBoard = document.querySelector('wc-chess-board');
                
                if (chessBoard) {
                    console.log(`Chessboard found after ${attempts} attempts!`);
                    addCoordinateLabels();
                    setupHoverEffect();
                    addToggleButton();
                    setupBoardOrientationObserver();
                    
                    // Force visibility of coordinates
                    const container = document.querySelector('.coordinate-labels-container');
                    if (container) {
                        container.style.display = 'block';
                        console.log("Coordinates container set to display: block");
                    }
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
                    addCoordinateLabels();
                    setupHoverEffect();
                    addToggleButton();
                    setupBoardOrientationObserver();
                    
                    // Force visibility of coordinates
                    const container = document.querySelector('.coordinate-labels-container');
                    if (container) {
                        container.style.display = 'block';
                        console.log("Coordinates container set to display: block");
                    }
                }
            });
            
            // Observe changes in the body
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Set maximum timeout for the observer
            setTimeout(function() {
                observer.disconnect();
            }, 30000); // 30 seconds max
        }
    }
    
    // Start initialization
    init();
    
    // Expose reset function globally for debugging
    window.reinitChessCoordinates = function() {
        retryCount = 0;
        init();
    };
    
    // Display confirmation message
    console.log("Chess coordinates script loaded successfully. Use window.reinitChessCoordinates() to reset if needed.");
})();
