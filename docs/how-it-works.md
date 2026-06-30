# How PDF Snake Works

PDF Snake is a small Snake game that runs inside a PDF file. It does not use a web page, canvas, or image animation. Instead, it uses old PDF form features in a playful way.

## Normal Game Screens vs. PDF Snake

Most games redraw a screen many times per second. A browser game might use an HTML canvas. A mobile game might use a graphics engine. In those systems, the game draws pixels, sprites, or shapes directly.

PDF Snake works differently. A PDF is usually a document, not a game surface. Chrome's PDF viewer does not give us a normal game canvas. So the game uses form fields as the screen.

## From Row Text to Cell Grid

The first prototype used a row text renderer. The board was 30 columns wide and 20 rows tall, and each row was one read-only text field in the PDF.

For example, a row might look like this:

```text
.............ooo@.....*........
```

The characters are the game graphics:

- `@` is the snake head.
- `o` is the snake body.
- `*` is the food.
- `.` is an empty cell.

When the snake moves, the JavaScript inside the PDF rewrites the text in each row field. That makes the board appear to update.

That prototype was useful because it proved the core trick: PDF JavaScript can update form fields repeatedly. But it had visual drawbacks. The row field borders looked like notebook lines, and the game board depended on the width and height of text characters.

The public v0.4.1 PDF tried a cell-color renderer. The board was 20 by 20, and each square was a tiny read-only form field named `cell_${row}_${col}`. The idea was to draw by changing each field's background color:

- Empty cells use a pale green.
- The snake head uses a dark green.
- The snake body uses a lighter green.
- Food uses red.
- The board border uses a darker wall color around the grid.

This makes the board look much closer to a real square game grid, while still staying inside ordinary AcroForm PDF features.

In Chrome desktop PDF viewer, that runtime `fillColor` change did not repaint reliably. v0.4.2 kept the same 20 by 20 cell grid, but switched to a more stable cell text renderer. v0.4.3 kept that approach and used ASCII-only symbols because Unicode glyphs can render inconsistently in PDF form fields.

v0.4.4 kept the text renderer but changed the public PDF to a landscape two-column layout. The old portrait page made the board and controls hard to see at once.

v0.4.5 changed the final public PDF from A4 landscape to a custom 16:9 page, 960 by 540pt. v0.4.8 tightens that again to 900 by 506pt and centers the board and controls as one content group. This is not meant for printing. It is tuned for Chrome's PDF viewer so the board and controls are easier to see together at 100% or fit-to-page zoom without vertical scrolling.

Each cell keeps a fixed pale green background. The JavaScript only changes field values:

- Empty cells use `""`.
- Snake body cells use `O`.
- Snake heads use `@`.
- Dying snake cells use `x`.
- Food uses `X`.

`O` and `X` are ASCII characters, so they are safer in PDF form fields than Unicode symbols. They are also a little more intuitive than the earlier `S` and `*` pairing.

v0.4.6 separates the static board from the changing text. Earlier cell-grid versions relied on each form field border to create grid lines. Chrome can refresh a field appearance when its value changes, which can make those borders look inconsistent after the snake passes through a cell. The final public version draws the 20 by 20 grid directly onto the PDF page with static graphics, then places nearly borderless form fields on top as text overlays. The grid is no longer part of the changing form appearance, so it stays visible.

v0.4.7 changes the snake head from directional arrows to `@`, keeps the body as `O`, keeps food as `X`, and uses `x` during the death blink. The goal is to make the snake read more like a small text-mode game while staying ASCII-only.

v0.4.8 keeps the game behavior the same, but reduces the public PDF page and board cell size slightly. The layout path is now portrait prototype, A4 landscape, 960 by 540pt custom 16:9, then 900 by 506pt custom 16:9. The last step is about fitting better in Chrome at 100% and making the full two-column interface feel centered.

The generator keeps the old row text PDFs as spikes. They are useful historical proofs, but the public playable file uses the cell-grid renderer.

## One Grid Size and One Coordinate System

The public Snake game uses a single `GRID_SIZE = 20` constant for the PDF fields, movement, food placement, rendering, and collision checks. The snake is stored as segments with `{row, col}` coordinates:

```text
{ row: 10, col: 10 }
```

That maps directly to the PDF field name:

```text
cell_10_10
```

Keeping everything in row/col form avoids mixing screen coordinates with game coordinates.

## Button Input

The PDF has AcroForm buttons named START, UP, DOWN, LEFT, RIGHT, SLOW, NORMAL, and FAST.

Each button has a small JavaScript action attached to it:

- START creates a new game.
- UP changes the next direction to up.
- DOWN changes the next direction to down.
- LEFT changes the next direction to left.
- RIGHT changes the next direction to right.
- SLOW, NORMAL, and FAST change how often the game loop runs.

The game also blocks immediate reverse turns. If the snake is moving right, pressing LEFT is ignored until the snake has changed to another direction.

## Cell Spikes

`generated/spike4_cell_color.pdf` is the experiment that showed runtime `fillColor` updates may not visibly repaint in Chrome PDF viewer.

`generated/spike5_cell_text.pdf` is the replacement debug spike. It has the same kind of cell fields as the public game. Pressing its button cycles the center cell through empty, `O`, and `X`. If that spike is visible in Chrome, the final Snake renderer should also be visible.

## Ready and Game Over Screens

Before the game starts, the grid starts with empty cell values.

When the snake hits a wall or its own body, the movement timer stops and the game enters a DYING state. Direction input is ignored during this state. The board blinks for a few frames by alternating the normal snake (`O O O @`) with a dead snake (`x x x x`). After the blink, the game enters GAME_OVER and writes GAME / OVER directly into the 20 by 20 grid. The Score field keeps the final score, and the Difficulty field keeps the selected difficulty.

Pressing START clears both the movement timer and the death-animation timer before starting a fresh game. This prevents duplicate intervals from stacking up after repeated restarts.

## Difficulty Buttons

The difficulty buttons do not change the rules of Snake. They change the timer interval:

- SLOW uses a longer delay between ticks.
- NORMAL is the default speed.
- FAST uses a shorter delay between ticks.

If a game is already running, changing difficulty clears the old interval and starts a new one with the selected speed. The current difficulty is shown in the Difficulty field.

v0.4.4 doubles the previous tick intervals. The game is intentionally slower so button input through PDF form controls feels less frantic.

## The Game Loop

Normal games have a loop that runs again and again: read input, update state, draw the screen.

PDF Snake does the same thing with PDF JavaScript:

1. START initializes the snake, score, food, and direction.
2. `app.setInterval` calls the game tick repeatedly.
3. Each tick moves the snake one cell.
4. The script checks for food, wall collisions, and self collisions.
5. The cell fields, score field, and difficulty field are updated.

So the PDF is still a document, but the form fields act like a tiny text-grid display.

## Why Chrome Desktop PDF Viewer

PDF JavaScript support is not consistent across PDF apps. Some viewers disable it completely. Some support form buttons but not timers. Some mobile PDF viewers are especially limited.

This project targets Chrome desktop PDF viewer because it supports the AcroForm interactions needed for this experiment: button actions, text field updates, and interval-based JavaScript. That makes the project easier to share and test with one clear recommended environment.
