# Chess.com Coordinates Extension

This Chrome extension displays chess square coordinates on chess.com with a hover effect.

## Features

- Displays coordinates on the chess.com board
- Hover effect that highlights the square being hovered over
- Works whether the board is flipped or not
- Toggle button to enable/disable coordinate display

## Installation

### Development Mode Installation

1. Download or clone this repository to your computer
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked extension"
5. Select the `chess_coordinates_extension` folder

### Installation from Chrome Web Store (coming soon)

1. Go to the extension page on the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

1. Visit [chess.com](https://www.chess.com)
2. The extension will activate automatically when a chessboard is detected
3. Square coordinates will be displayed on the board
4. Hover over a square to highlight its coordinates
5. Use the "Hide Coordinates" button in the bottom right to hide/show coordinates

## Troubleshooting

If coordinates are not displaying correctly:

1. Refresh the page
2. Open the browser console (F12) and check for error messages
3. Reset the extension by typing `window.reinitChessCoordinates()` in the console

## License

This project is licensed under the MIT License.
