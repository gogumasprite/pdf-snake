# Demo GIF

`pdf-snake-demo.gif` is intentionally not committed yet.

Automatic capture was not reliable in the Codex environment because the real Chrome PDF viewer window could open, but the captured view did not consistently expose the playable main PDF page. Do not replace this with a simulated animation; the README demo should show the actual PDF running in Chrome desktop.

To create the real demo GIF manually:

1. Open `generated/playable-pdf-snake.pdf` in Chrome desktop.
2. Adjust Chrome zoom or fit-to-page so the full PDF fits in the recording area.
3. Use ScreenToGif, OBS, or another screen recorder.
4. Record 7 to 10 seconds: click START, steer the snake, eat food if convenient, hit a wall, show the `x` death blink, and show GAME / OVER.
5. Save the GIF as `docs/assets/pdf-snake-demo.gif`.
6. Replace the README's "Demo GIF coming soon" text with:

```md
![PDF Snake demo](docs/assets/pdf-snake-demo.gif)
```
