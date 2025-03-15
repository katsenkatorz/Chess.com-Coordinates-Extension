// Chess.com Coordinates Extension
// Script that displays chess square coordinates on chess.com with hover effect

(function() {
    'use strict';
    
    // Configuration
    const MAX_RETRIES = 20;
    const RETRY_INTERVAL = 500; // ms
    let retryCount = 0;
    let extensionEnabled = true; // Track if the extension is enabled (power button state)
    let currentBoardOrientation = false; // false = standard (white at bottom), true = flipped (black at bottom)
    let currentCoordinatesVisible = true; // Track if coordinates are currently visible
    let hideOriginalCoordinates = true; // Track if original Chess.com coordinates should be hidden
    let enableHoverEffect = true; // Track if hover effect is enabled
    let showOnlyOnHover = false; // Track if coordinates should only be shown on hover
    let showLegalMoves = false; // Track if legal moves should be shown for selected pieces
    let fontSizePercentage = 100; // Font size percentage (default: 100%)
    let coordinateOpacity = 0.06; // Default opacity for coordinates (0.06 = 6%)
    let hoverOpacity = 0.3; // Default opacity for hovered coordinates (0.3 = 30%)
    let legalMoveOpacity = 0.2; // Opacité réduite pour un rendu plus subtil des coordonnées sur les mouvements légaux
    
    // Function to calculate appropriate font size based on board size
    function calculateFontSize(chessBoard) {
        if (!chessBoard) return 'min(8.5vw, 8.5vh)';
        
        const boardRect = chessBoard.getBoundingClientRect();
        const squareSize = boardRect.width / 8; // Size of one square
        
        // Calculate base size proportional to the square size
        const baseSize = squareSize * 1.3;
        
        // Apply the user's font size percentage preference
        const adjustedSize = baseSize * (fontSizePercentage / 100);
        
        // Return the adjusted font size
        return `${adjustedSize}px`;
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
    
    // Function to update opacity of all coordinate labels
    function updateCoordinateOpacity() {
        const labels = document.querySelectorAll('.coordinate-label');
        if (!labels.length) return;
        
        labels.forEach(label => {
            label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`;
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
        
        // If we're hiding coordinates, set up a mutation observer to catch any newly added coordinates
        if (!show) {
            setupCoordinatesMutationObserver();
        }
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
                label.style.fontFamily = 'Impact, Arial Black, sans-serif'; // Impact font
                label.style.fontSize = calculateFontSize(chessBoard); // Dynamic font size based on board size
                label.style.fontWeight = 'normal'; // Impact is already bold
                label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`; // Use the global opacity setting
                label.style.backgroundColor = 'transparent'; // No background
                label.style.width = '12.5%'; // Width of one square
                label.style.height = '12.5%'; // Height of one square
                label.style.display = 'flex';
                label.style.justifyContent = 'center'; // Center horizontally
                label.style.alignItems = 'center'; // Center vertically
                label.style.boxSizing = 'border-box';
                label.style.overflow = 'hidden'; // Hide text overflow
                label.style.zIndex = '-10'; // Negative z-index to stay behind pieces
                label.style.transition = 'color 0.3s ease, opacity 0.2s ease-in-out'; // Smooth transition for color and opacity changes
                
                // Set initial opacity based on showOnlyOnHover setting
                if (showOnlyOnHover) {
                    label.style.opacity = '0';
                }
                
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
    function setupHoverEffect(forceEnable) {
        // Si l'extension est désactivée et forceEnable n'est pas true, ne pas ajouter d'écouteurs d'événements
        if (!extensionEnabled && forceEnable !== true) {
            const chessBoard = document.querySelector('wc-chess-board');
            if (chessBoard) {
                // Remove any existing event listeners
                chessBoard.removeEventListener('mousemove', handleMouseMove);
                chessBoard.removeEventListener('mouseleave', handleMouseLeave);
                chessBoard.removeEventListener('click', handlePieceSelection);
            }
            return;
        }
        
        const chessBoard = document.querySelector('wc-chess-board');
        if (!chessBoard) return;
        
        // Remove any existing event listeners
        chessBoard.removeEventListener('mousemove', handleMouseMove);
        chessBoard.removeEventListener('mouseleave', handleMouseLeave);
        chessBoard.removeEventListener('click', handlePieceSelection);
        
        // Si l'extension est désactivée et forceEnable n'est pas true, ne pas ajouter d'écouteurs d'événements
        if (!currentCoordinatesVisible && forceEnable !== true) {
            return;
        }
        
        // Only add the event listeners if hover effect is enabled
        if (enableHoverEffect) {
            // Add event listener for mouse movement
            chessBoard.addEventListener('mousemove', handleMouseMove);
            
            // Add event listener for mouse leaving the board
            chessBoard.addEventListener('mouseleave', handleMouseLeave);
        }
        
        // Add piece selection listener for legal moves feature if showLegalMoves is enabled
        if (showLegalMoves) {
            chessBoard.addEventListener('click', handlePieceSelection);
        }
    }
    
    // Function to handle piece selection for legal moves
    function handlePieceSelection(e) {
        if (!showLegalMoves) return;
        
        // Clear previous legal move highlights
        clearLegalMoveHighlights();
        
        // Check if a piece was clicked
        const piece = e.target.closest('.piece');
        if (piece) {
            // Highlight legal moves for the selected piece
            highlightLegalMoves(piece);
        }
    }
    
    // Function to handle mouse movement for hover effect
    function handleMouseMove(e) {
        // Get board dimensions
        const rect = e.currentTarget.getBoundingClientRect();
        const squareSize = rect.width / 8;
        
        // Calculate mouse position relative to the board
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Determine the hovered square's physical position
        const physicalCol = Math.floor(x / squareSize);
        const physicalRow = Math.floor(y / squareSize);
        
        // Select all labels
        const labels = document.querySelectorAll('.coordinate-label');
        
        if (showOnlyOnHover) {
            // Hide all labels first, except legal moves if enabled
            labels.forEach(label => {
                if (!(showLegalMoves && label.dataset.isLegalMove === 'true')) {
                    label.style.opacity = '0';
                }
            });
        } else {
            // Reset all labels to their normal opacity
            labels.forEach(label => {
                // Ne pas réinitialiser les cases de mouvements légaux
                if (!(showLegalMoves && label.dataset.isLegalMove === 'true')) {
                    label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`;
                    label.style.fontWeight = 'normal';
                    label.style.textShadow = 'none';
                }
                // Réinitialiser le flag isHovered
                label.dataset.isHovered = 'false';
            });
        }
        
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
                    // Marquer cette case comme survolée
                    label.dataset.isHovered = 'true';
                    
                    if (showOnlyOnHover) {
                        label.style.opacity = '1';
                        // Même si c'est un mouvement légal, priorité au survol
                        label.style.color = `rgba(0, 0, 0, ${hoverOpacity})`;
                    } else {
                        // Même si c'est un mouvement légal, priorité au survol
                        label.style.color = `rgba(0, 0, 0, ${hoverOpacity})`;
                    }
                    found = true;
                    break;
                }
            }
        }
    }
    
    // Function to handle mouse leaving the board
    function handleMouseLeave() {
        const labels = document.querySelectorAll('.coordinate-label');
        
        // Réinitialiser tous les flags isHovered
        labels.forEach(label => {
            label.dataset.isHovered = 'false';
        });
        
        if (showOnlyOnHover) {
            // Hide all labels when mouse leaves the board, except legal moves if enabled
            labels.forEach(label => {
                // Si nous montrons les mouvements légaux et que c'est un mouvement légal, ne pas le cacher
                if (showLegalMoves && label.dataset.isLegalMove === 'true') {
                    label.style.opacity = '1';
                    // Appliquer les styles de mise en évidence pour les mouvements légaux
                    // Utiliser legalMoveOpacity car nous sommes en mode showOnlyOnHover
                    label.style.color = `rgba(0, 0, 0, ${legalMoveOpacity})`;
                    label.style.fontWeight = 'bold';
                    label.style.zIndex = '5';
                } else {
                    label.style.opacity = '0';
                }
            });
        } else {
            // Reset all labels to their normal opacity
            labels.forEach(label => {
                // If we're showing legal moves and this is a legal move square, keep it highlighted
                if (showLegalMoves && label.dataset.isLegalMove === 'true') {
                    // Utiliser hoverOpacity quand showOnlyOnHover est désactivé, sinon utiliser legalMoveOpacity
                    const opacityToUse = !showOnlyOnHover ? hoverOpacity : legalMoveOpacity;
                    label.style.color = `rgba(0, 0, 0, ${opacityToUse})`;
                    label.style.fontWeight = 'bold';
                    label.style.zIndex = '5';
                } else {
                    label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`;
                    label.style.fontWeight = 'normal';
                    label.style.textShadow = 'none';
                    label.style.zIndex = '-10';
                }
            });
        }
    }
    
    // Function to highlight legal moves for a selected piece
    function highlightLegalMoves(selectedPiece) {
        if (!showLegalMoves || !selectedPiece) return;
        
        // Clear previous legal move highlights
        clearLegalMoveHighlights();
        
        // Attendre que Chess.com ajoute les éléments 'hint' au DOM
        setTimeout(() => {
            // Utiliser les éléments 'hint' que Chess.com ajoute au DOM
            const hintElements = document.querySelectorAll('[data-test-element="hint"]');
            if (hintElements.length === 0) return;
            
            // Trouver les cases correspondant aux indices des éléments 'hint'
            hintElements.forEach(hint => {
                const hintClasses = hint.getAttribute('class');
                if (!hintClasses) return;
                
                // Extraire le numéro de case à partir de la classe (ex: 'hint square-54')
                const squareMatch = hintClasses.match(/square-(\d+)/);
                if (!squareMatch) return;
                
                const squareNumber = parseInt(squareMatch[1]);
                if (isNaN(squareNumber)) return;
                
                // Convertir le numéro de case en notation algébrique
                // Chess.com utilise un système où 11=a1, 18=h1, 81=a8, 88=h8
                const col = Math.floor(squareNumber / 10) - 1;
                const row = squareNumber % 10 - 1;
                
                if (col < 0 || col > 7 || row < 0 || row > 7) return;
                
                const algebraic = String.fromCharCode(97 + col) + (row + 1);
                
                // Trouver le label correspondant à cette case
                const labels = document.querySelectorAll('.coordinate-label');
                labels.forEach(label => {
                    if (label.dataset.algebraic.toLowerCase() === algebraic) {
                        // Ne mettre en évidence que si la case n'est pas déjà survolée
                        if (label.dataset.isHovered !== 'true') {
                            // Mettre en évidence les coordonnées des mouvements légaux
                            // Utiliser hoverOpacity quand showOnlyOnHover est désactivé, sinon utiliser legalMoveOpacity
                            const opacityToUse = !showOnlyOnHover ? hoverOpacity : legalMoveOpacity;
                            label.style.color = `rgba(0, 0, 0, ${opacityToUse})`;
                            label.style.fontWeight = 'bold';
                            label.style.zIndex = '5'; // Amener les coordonnées au premier plan
                        }
                        // Toujours marquer comme mouvement légal pour référence future
                        label.dataset.isLegalMove = 'true';
                        
                        // S'assurer que les coordonnées sont toujours visibles pour les mouvements légaux,
                        // même si Show Coordinates est désactivé ou en mode 'showOnlyOnHover'
                        label.style.opacity = '1';
                    }
                });
            });
        }, 50); // Petit délai pour s'assurer que Chess.com a eu le temps d'ajouter les éléments 'hint'
    }
    
    // Function to clear legal move highlights
    function clearLegalMoveHighlights() {
        const labels = document.querySelectorAll('.coordinate-label');
        labels.forEach(label => {
            // Marquer que ce n'est plus un mouvement légal
            label.dataset.isLegalMove = 'false';
            
            // Si on est en mode 'showOnlyOnHover' et que la case n'est pas survolée, la cacher
            if (showOnlyOnHover && label.dataset.isHovered !== 'true') {
                label.style.opacity = '0';
            }
            
            // Si la case n'est pas survolée, réinitialiser tous les styles
            if (label.dataset.isHovered !== 'true') {
                label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`;
                label.style.fontWeight = 'normal';
                label.style.textShadow = 'none';
                label.style.zIndex = '-10'; // Remettre les coordonnées en arrière-plan
            }
        });
    }
    
    // Function to calculate legal moves for a piece
    function calculateLegalMoves(pieceType, pieceColor, currentSquare, occupiedSquares, isFlipped) {
        const legalMoves = [];
        const file = currentSquare.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, etc.
        const rank = parseInt(currentSquare[1]) - 1; // '1' -> 0, '2' -> 1, etc.
        
        // Helper function to check if a square is valid and add it to legal moves
        function addMoveIfValid(fileOffset, rankOffset) {
            const newFile = file + fileOffset;
            const newRank = rank + rankOffset;
            
            // Check if the new square is on the board
            if (newFile < 0 || newFile > 7 || newRank < 0 || newRank > 7) {
                return false; // Off the board
            }
            
            const newSquare = String.fromCharCode(97 + newFile) + (newRank + 1);
            const occupant = occupiedSquares[newSquare];
            
            // If the square is occupied by a piece of the same color, it's not a legal move
            if (occupant === pieceColor) {
                return false;
            }
            
            // Add the square to legal moves
            legalMoves.push(newSquare);
            
            // Return true if the square is empty, false if it's occupied by an opponent's piece
            return !occupant;
        }
        
        // Calculate moves based on piece type
        switch (pieceType.toLowerCase()) {
            case 'p': // Pawn
                const direction = pieceColor === 'w' ? 1 : -1; // White moves up, black moves down
                const startRank = pieceColor === 'w' ? 1 : 6; // Starting rank for pawns
                
                // Forward move
                if (addMoveIfValid(0, direction) && rank === startRank) {
                    // Double move from starting position
                    addMoveIfValid(0, direction * 2);
                }
                
                // Capture moves
                // Check if there's an opponent's piece to capture
                const leftCapture = String.fromCharCode(97 + file - 1) + (rank + direction + 1);
                const rightCapture = String.fromCharCode(97 + file + 1) + (rank + direction + 1);
                
                if (file > 0 && occupiedSquares[leftCapture] && occupiedSquares[leftCapture] !== pieceColor) {
                    addMoveIfValid(-1, direction);
                }
                
                if (file < 7 && occupiedSquares[rightCapture] && occupiedSquares[rightCapture] !== pieceColor) {
                    addMoveIfValid(1, direction);
                }
                
                // Note: En passant and promotion are not implemented for simplicity
                break;
                
            case 'r': // Rook
                // Horizontal and vertical moves
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(i, 0)) break; // Right
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(-i, 0)) break; // Left
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(0, i)) break; // Up
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(0, -i)) break; // Down
                }
                break;
                
            case 'n': // Knight
                // Knight's L-shaped moves
                addMoveIfValid(1, 2);
                addMoveIfValid(2, 1);
                addMoveIfValid(2, -1);
                addMoveIfValid(1, -2);
                addMoveIfValid(-1, -2);
                addMoveIfValid(-2, -1);
                addMoveIfValid(-2, 1);
                addMoveIfValid(-1, 2);
                break;
                
            case 'b': // Bishop
                // Diagonal moves
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(i, i)) break; // Up-right
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(-i, i)) break; // Up-left
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(i, -i)) break; // Down-right
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(-i, -i)) break; // Down-left
                }
                break;
                
            case 'q': // Queen
                // Combines rook and bishop moves
                // Horizontal and vertical moves (like rook)
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(i, 0)) break; // Right
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(-i, 0)) break; // Left
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(0, i)) break; // Up
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(0, -i)) break; // Down
                }
                
                // Diagonal moves (like bishop)
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(i, i)) break; // Up-right
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(-i, i)) break; // Up-left
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(i, -i)) break; // Down-right
                }
                for (let i = 1; i <= 7; i++) {
                    if (!addMoveIfValid(-i, -i)) break; // Down-left
                }
                break;
                
            case 'k': // King
                // King moves one square in any direction
                addMoveIfValid(1, 0);  // Right
                addMoveIfValid(1, 1);  // Up-right
                addMoveIfValid(0, 1);  // Up
                addMoveIfValid(-1, 1); // Up-left
                addMoveIfValid(-1, 0); // Left
                addMoveIfValid(-1, -1); // Down-left
                addMoveIfValid(0, -1); // Down
                addMoveIfValid(1, -1); // Down-right
                
                // Note: Castling is not implemented for simplicity
                break;
        }
        
        return legalMoves;
    }
    
    // Function to toggle coordinate visibility - acts as a power button for the entire extension
    function toggleCoordinatesVisibility(show) {
        // Mettre à jour l'état global de l'extension
        extensionEnabled = show;
        
        // Si show est false, désactiver complètement l'extension
        if (!show) {
            // Masquer le conteneur de coordonnées
            const container = document.querySelector('.coordinate-labels-container');
            if (container) {
                container.style.display = 'none';
            }
            
            // Rétablir les coordonnées originales de Chess.com
            const originalCoordinates = document.querySelectorAll('wc-chess-board svg.coordinates, wc-chess-board svg.coordinates text');
            originalCoordinates.forEach(coord => {
                coord.style.display = 'block';
            });
            
            // Désactiver les écouteurs d'événements pour les mouvements de souris
            setupHoverEffect(false);
            
            // Save state to local variable
            currentCoordinatesVisible = false;
            return;
        }
        
        // Si show est true, activer l'extension
        const container = document.querySelector('.coordinate-labels-container');
        if (container) {
            // Afficher le conteneur
            container.style.display = 'block';
            
            // Mettre à jour l'état des coordonnées individuelles
            const labels = document.querySelectorAll('.coordinate-label');
            labels.forEach(label => {
                // Si c'est un mouvement légal et que showLegalMoves est activé, toujours afficher
                if (showLegalMoves && label.dataset.isLegalMove === 'true') {
                    // Garder visible
                    label.style.opacity = '1';
                    // Appliquer le style approprié selon le mode
                    const opacityToUse = !showOnlyOnHover ? hoverOpacity : legalMoveOpacity;
                    label.style.color = `rgba(0, 0, 0, ${opacityToUse})`;
                    label.style.fontWeight = 'bold';
                    label.style.zIndex = '5';
                } else {
                    // Afficher normalement
                    if (showOnlyOnHover) {
                        label.style.opacity = '0'; // Caché jusqu'au survol
                    } else {
                        label.style.opacity = '1';
                        label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`;
                        label.style.fontWeight = 'normal';
                        label.style.zIndex = '-10';
                    }
                }
            });
            
            // Show/hide original coordinates based on hideOriginalCoordinates setting
            toggleOriginalCoordinates(!hideOriginalCoordinates);
            
            // Activer les écouteurs d'événements pour les mouvements de souris
            setupHoverEffect(true);
        } else {
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
                // Si l'extension est désactivée, ne rien faire
                if (!extensionEnabled) return;
                
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
            return;
        }
        
        // Si l'extension est désactivée, ne pas traiter les autres messages
        if (!extensionEnabled) {
            sendResponse({ success: false, reason: 'Extension is disabled' });
            return;
        }
        
        if (message.action === 'toggleOriginalCoordinates') {
            hideOriginalCoordinates = message.hide;
            toggleOriginalCoordinates(!hideOriginalCoordinates);
            sendResponse({ success: true });
        } else if (message.action === 'toggleHoverEffect') {
            enableHoverEffect = message.enable;
            setupHoverEffect();
            sendResponse({ success: true });
        } else if (message.action === 'updateFontSize') {
            fontSizePercentage = message.percentage;
            updateCoordinateFontSizes();
            sendResponse({ success: true });
        } else if (message.action === 'toggleShowOnlyOnHover') {
            showOnlyOnHover = message.enable;
            
            // Update all labels to reflect the new setting
            const labels = document.querySelectorAll('.coordinate-label');
            if (showOnlyOnHover) {
                labels.forEach(label => {
                    label.style.opacity = '0';
                });
            } else {
                labels.forEach(label => {
                    label.style.opacity = '1';
                    label.style.color = `rgba(0, 0, 0, ${coordinateOpacity})`;
                });
            }
            sendResponse({ success: true });
        } else if (message.action === 'updateOpacity') {
            coordinateOpacity = message.opacity;
            // If hover opacity is not provided, calculate it based on normal opacity
            hoverOpacity = message.hoverOpacity || Math.min(coordinateOpacity * 5, 0.5);
            updateCoordinateOpacity();
            sendResponse({ success: true });
        } else if (message.action === 'toggleShowLegalMoves') {
            showLegalMoves = message.enable;
            
            // If show legal moves is disabled, clear any existing highlights
            if (!showLegalMoves) {
                clearLegalMoveHighlights();
            } else {
                // Si on active showLegalMoves, on doit s'assurer que les coordonnées sont visibles
                // même si Show Coordinates est désactivé
                toggleCoordinatesVisibility(currentCoordinatesVisible);
            }
            
            sendResponse({ success: true });
        }
        return true; // Indicate we want to send a response asynchronously
    });
    
    // Set up a mutation observer to detect when Chess.com adds coordinates to the DOM
    function setupCoordinatesMutationObserver() {
        // Create a mutation observer to watch for changes to the DOM
        const coordinatesObserver = new MutationObserver(function(mutations) {
            // Check if any new SVG coordinates were added
            const newCoordinates = document.querySelectorAll('wc-chess-board svg.coordinates');
            if (newCoordinates.length > 0) {
                // Apply the current setting for hiding original coordinates
                newCoordinates.forEach(svg => {
                    svg.style.display = hideOriginalCoordinates ? 'none' : 'block';
                });
                
                // Also check for text elements
                const newCoordinateTexts = document.querySelectorAll('wc-chess-board svg.coordinates text');
                newCoordinateTexts.forEach(text => {
                    text.style.display = hideOriginalCoordinates ? 'none' : 'block';
                });
            }
        });
        
        // Start observing the document with the configured parameters
        coordinatesObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    // Main initialization function
    function init() {
        console.log("Initializing chess coordinates extension...");
        
        // Check stored visibility preferences
        chrome.storage.sync.get(['showCoordinates', 'hideOriginalCoordinates', 'enableHoverEffect', 'showOnlyOnHover', 'showLegalMoves', 'fontSizePercentage', 'coordinateOpacity', 'hoverOpacity'], function(result) {
            // Default to true if not set
            currentCoordinatesVisible = result.showCoordinates !== undefined ? result.showCoordinates : true;
            hideOriginalCoordinates = result.hideOriginalCoordinates !== undefined ? result.hideOriginalCoordinates : true;
            enableHoverEffect = result.enableHoverEffect !== undefined ? result.enableHoverEffect : true;
            showOnlyOnHover = result.showOnlyOnHover !== undefined ? result.showOnlyOnHover : true;
            showLegalMoves = result.showLegalMoves !== undefined ? result.showLegalMoves : false; // Default to false for show legal moves
            fontSizePercentage = result.fontSizePercentage !== undefined ? result.fontSizePercentage : 100;
            coordinateOpacity = result.coordinateOpacity !== undefined ? result.coordinateOpacity : 0.06;
            hoverOpacity = result.hoverOpacity !== undefined ? result.hoverOpacity : 0.3;
            
            // Set up the mutation observer if we're hiding original coordinates
            if (hideOriginalCoordinates) {
                setupCoordinatesMutationObserver();
            }
            
            // Try to find the chessboard immediately
            const initialChessBoard = document.querySelector('wc-chess-board');
            
            if (initialChessBoard) {
                console.log("Chessboard found on initial load!");
                // Chessboard is already in the DOM, add coordinates immediately
                addCoordinateLabels();
                updateCoordinateFontSizes(); // Apply the saved font size
                updateCoordinateOpacity(); // Apply the saved opacity
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
