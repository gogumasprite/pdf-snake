## v0.5.1 - Clear Ending Patch

This patch adds a proper clear ending to PDF Snake.

### Changes
- Added a `CLEAR` state when the snake fills the entire 20×20 board.
- Displays `CLEAR` inside the PDF grid without reintroducing a Status field.
- Reworked food spawning to use an `emptyCells` list instead of a retry loop.
- Prevents edge cases when the board is completely filled.
- START now restarts cleanly from READY, RUNNING, DYING, GAME_OVER, and CLEAR states.

### Recommended environment
- Chrome desktop PDF viewer

### Asset
Open `playable-pdf-snake.pdf` in Chrome desktop PDF viewer and click START.
