import {
  DEATH_ANIMATION_FRAME_COUNT,
  DEATH_ANIMATION_FRAME_MS,
  FAST_TICK_MS,
  GRID_SIZE,
  NORMAL_TICK_MS,
  ROW_BOARD_COLUMNS,
  ROW_BOARD_ROWS,
  SLOW_TICK_MS,
} from './constants.js';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'SLOW' | 'NORMAL' | 'FAST';

const directionDeltas: Record<Direction, {col: number; row: number}> = {
  UP: {col: 0, row: -1},
  DOWN: {col: 0, row: 1},
  LEFT: {col: -1, row: 0},
  RIGHT: {col: 1, row: 0},
};

function jsString(value: string): string {
  return JSON.stringify(value);
}

function fieldAssignment(name: string, valueExpression: string): string {
  return `this.getField(${jsString(name)}).value = ${valueExpression};`;
}

export function buildCounterScript(): string {
  return `
if (typeof counterValue === 'undefined') {
  var counterValue = 0;
}
counterValue += 1;
${fieldAssignment('counter', 'String(counterValue)')}
`;
}

export function buildMotionScript(): string {
  return `
var motionDoc = this;
if (typeof motionTimer !== 'undefined' && motionTimer) {
  app.clearInterval(motionTimer);
}
var motionColumn = 0;
function drawMotionFrame() {
  for (var row = 0; row < ${ROW_BOARD_ROWS}; row += 1) {
    var text = '';
    for (var col = 0; col < ${ROW_BOARD_COLUMNS}; col += 1) {
      text += row === 10 && col === motionColumn ? 'O' : '.';
    }
    motionDoc.getField('row_' + row).value = text;
  }
  motionColumn = (motionColumn + 1) % ${ROW_BOARD_COLUMNS};
}
drawMotionFrame();
motionTimer = app.setInterval('drawMotionFrame();', ${NORMAL_TICK_MS});
`;
}

export function buildDirectionButtonScript(direction: Direction): string {
  const delta = directionDeltas[direction];
  return `
if (typeof currentDirection === 'undefined') {
  var currentDirection = 'RIGHT';
}
currentDirection = ${jsString(direction)};
${fieldAssignment('status', jsString(`Direction: ${direction} (${delta.row}, ${delta.col})`))}
`;
}

export function buildSnakeBootScript(): string {
  return `
var snakeDoc = this;
if (typeof snakeGameReady === 'undefined') {
  var snakeGameReady = true;
  var snakeTimer = null;
  var deathAnimationTimer = null;
  var deathAnimationFrame = 0;
  var snakeState = 'READY';
  var snakeDifficulty = 'NORMAL';
  var snakeTickMs = ${NORMAL_TICK_MS};
  var snakeDirection = 'RIGHT';
  var snakePendingDirection = 'RIGHT';
  var snakeBody = [];
  var snakeFood = {row: 0, col: 0};
  var snakeScore = 0;
  var snakeRunning = false;
  var snakeMissingCell = '';

  function setField(name, value) {
    var field = snakeDoc.getField(name);
    if (field) {
      field.value = String(value);
    }
  }

  function setDifficultyField() {
    setField('difficulty', snakeDifficulty);
  }

  function setStatus(message) {
    setField('status', message + ' | Difficulty: ' + snakeDifficulty);
    setDifficultyField();
  }

  function reportMissingCell() {
    if (snakeMissingCell) {
      setField('status', 'Missing field: ' + snakeMissingCell);
    }
  }

  function setCellValue(row, col, value) {
    var fieldName = 'cell_' + row + '_' + col;
    var field = snakeDoc.getField(fieldName);
    if (!field) {
      snakeMissingCell = fieldName;
      return;
    }
    field.value = value;
  }

  function clearBoard() {
    snakeMissingCell = '';
    for (var row = 0; row < ${GRID_SIZE}; row += 1) {
      for (var col = 0; col < ${GRID_SIZE}; col += 1) {
        setCellValue(row, col, '');
      }
    }
  }

  function drawReadyScreen() {
    snakeState = 'READY';
    snakeRunning = false;
    clearBoard();
    setStatus('Press START to play');
  }

  function clearGameTimer() {
    if (snakeTimer) {
      app.clearInterval(snakeTimer);
      snakeTimer = null;
    }
  }

  function clearDeathAnimationTimer() {
    if (deathAnimationTimer) {
      app.clearInterval(deathAnimationTimer);
      deathAnimationTimer = null;
    }
  }

  function clearAllTimers() {
    clearGameTimer();
    clearDeathAnimationTimer();
  }

  function scheduleSnakeTick() {
    clearGameTimer();
    if (snakeState === 'RUNNING') {
      snakeTimer = app.setInterval('tickSnake();', snakeTickMs);
    }
  }

  function isOppositeDirection(a, b) {
    return (a === 'UP' && b === 'DOWN') ||
      (a === 'DOWN' && b === 'UP') ||
      (a === 'LEFT' && b === 'RIGHT') ||
      (a === 'RIGHT' && b === 'LEFT');
  }

  function directionDelta(direction) {
    if (direction === 'UP') {
      return {row: -1, col: 0};
    }
    if (direction === 'DOWN') {
      return {row: 1, col: 0};
    }
    if (direction === 'LEFT') {
      return {row: 0, col: -1};
    }
    return {row: 0, col: 1};
  }

  function containsCell(cells, row, col) {
    for (var index = 0; index < cells.length; index += 1) {
      if (cells[index].row === row && cells[index].col === col) {
        return true;
      }
    }
    return false;
  }

  function placeFood() {
    var emptyCells = [];
    for (var row = 0; row < ${GRID_SIZE}; row += 1) {
      for (var col = 0; col < ${GRID_SIZE}; col += 1) {
        if (!containsCell(snakeBody, row, col)) {
          emptyCells.push({row: row, col: col});
        }
      }
    }
    if (emptyCells.length === 0) {
      snakeFood = {row: -1, col: -1};
      return;
    }
    snakeFood = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function renderBoard() {
    clearBoard();
    if (snakeFood.row >= 0 && snakeFood.col >= 0) {
      setCellValue(snakeFood.row, snakeFood.col, 'X');
    }
    for (var index = 1; index < snakeBody.length; index += 1) {
      setCellValue(snakeBody[index].row, snakeBody[index].col, 'O');
    }
    if (snakeBody.length > 0) {
      setCellValue(snakeBody[0].row, snakeBody[0].col, '@');
    }
    setField('score', snakeScore);
    setStatus(snakeState === 'RUNNING' ? 'Running' : 'Press START to play');
    reportMissingCell();
  }

  function renderDeadSnakeFrame(showDead) {
    clearBoard();
    var glyph = showDead ? 'x' : 'O';
    for (var index = 1; index < snakeBody.length; index += 1) {
      setCellValue(snakeBody[index].row, snakeBody[index].col, glyph);
    }
    if (snakeBody.length > 0) {
      setCellValue(snakeBody[0].row, snakeBody[0].col, showDead ? 'x' : '@');
    }
    setField('score', snakeScore);
    reportMissingCell();
  }

  function renderCenteredWord(row, word) {
    var startCol = Math.floor((${GRID_SIZE} - word.length) / 2);
    for (var index = 0; index < word.length; index += 1) {
      setCellValue(row, startCol + index, word.charAt(index));
    }
  }

  function renderGameOverText() {
    clearBoard();
    renderCenteredWord(8, 'GAME');
    renderCenteredWord(10, 'OVER');
    setField('score', snakeScore);
    reportMissingCell();
  }

  function startSnake() {
    clearAllTimers();
    snakeScore = 0;
    snakeDirection = 'RIGHT';
    snakePendingDirection = 'RIGHT';
    var center = Math.floor(${GRID_SIZE} / 2);
    snakeBody = [
      {row: center, col: center},
      {row: center, col: center - 1},
      {row: center, col: center - 2}
    ];
    snakeState = 'RUNNING';
    snakeRunning = true;
    deathAnimationFrame = 0;
    placeFood();
    setStatus('Running');
    renderBoard();
    scheduleSnakeTick();
  }

  function setSnakeDirection(nextDirection) {
    if (snakeState !== 'RUNNING') {
      setStatus('Press START to play');
      return;
    }
    if (!isOppositeDirection(snakeDirection, nextDirection)) {
      snakePendingDirection = nextDirection;
      setStatus('Queued: ' + nextDirection);
    }
  }

  function setSnakeDifficulty(nextDifficulty) {
    snakeDifficulty = nextDifficulty;
    if (nextDifficulty === 'SLOW') {
      snakeTickMs = ${SLOW_TICK_MS};
    } else if (nextDifficulty === 'FAST') {
      snakeTickMs = ${FAST_TICK_MS};
    } else {
      snakeTickMs = ${NORMAL_TICK_MS};
    }
    scheduleSnakeTick();
    setStatus(snakeState === 'RUNNING' ? 'Running' : 'Press START');
  }

  function startDeathAnimation() {
    clearGameTimer();
    clearDeathAnimationTimer();
    snakeState = 'DYING';
    snakeRunning = false;
    snakeFood = {row: -1, col: -1};
    deathAnimationFrame = 0;
    renderDeadSnakeFrame(false);
    deathAnimationTimer = app.setInterval('tickDeathAnimation();', ${DEATH_ANIMATION_FRAME_MS});
  }

  function tickDeathAnimation() {
    deathAnimationFrame += 1;
    if (deathAnimationFrame >= ${DEATH_ANIMATION_FRAME_COUNT}) {
      clearDeathAnimationTimer();
      snakeState = 'GAME_OVER';
      renderGameOverText();
      return;
    }
    renderDeadSnakeFrame(deathAnimationFrame % 2 === 1);
  }

  function tickSnake() {
    if (snakeState !== 'RUNNING') {
      return;
    }
    if (!isOppositeDirection(snakeDirection, snakePendingDirection)) {
      snakeDirection = snakePendingDirection;
    }
    var delta = directionDelta(snakeDirection);
    var head = snakeBody[0];
    var nextHead = {row: head.row + delta.row, col: head.col + delta.col};
    if (nextHead.row < 0 || nextHead.row >= ${GRID_SIZE} ||
        nextHead.col < 0 || nextHead.col >= ${GRID_SIZE} ||
        containsCell(snakeBody, nextHead.row, nextHead.col)) {
      startDeathAnimation();
      return;
    }
    snakeBody.unshift(nextHead);
    if (nextHead.row === snakeFood.row && nextHead.col === snakeFood.col) {
      snakeScore += 1;
      placeFood();
    } else {
      snakeBody.pop();
    }
    renderBoard();
  }

  drawReadyScreen();
  setField('score', snakeScore);
}
`;
}

export function buildCellColorSpikeScript(): string {
  return `
if (typeof spike4Toggle === 'undefined') {
  var spike4Toggle = false;
}
spike4Toggle = !spike4Toggle;
var centerCell = this.getField('cell_10_10');
centerCell.value = '';
centerCell.fillColor = spike4Toggle ? ['RGB', 0.95, 0.16, 0.05] : ['RGB', 0.02, 0.16, 0.08];
centerCell.strokeColor = centerCell.fillColor;
this.getField('status').value = spike4Toggle ? 'Center cell: FOOD color' : 'Center cell: HEAD color';
`;
}

export function buildCellTextSpikeScript(): string {
  return `
if (typeof spike5Step === 'undefined') {
  var spike5Step = 0;
}
spike5Step = (spike5Step + 1) % 3;
var centerCell = this.getField('cell_10_10');
if (spike5Step === 0) {
  centerCell.value = '';
  this.getField('status').value = 'Center cell: empty';
} else if (spike5Step === 1) {
  centerCell.value = 'O';
  this.getField('status').value = 'Center cell: snake text';
} else {
  centerCell.value = 'X';
  this.getField('status').value = 'Center cell: food text';
}
`;
}

export function buildSnakeStartScript(): string {
  return `${buildSnakeBootScript()}
startSnake();
`;
}

export function buildSnakeDirectionScript(direction: Direction): string {
  return `${buildSnakeBootScript()}
setSnakeDirection(${jsString(direction)});
`;
}

export function buildSnakeDifficultyScript(difficulty: Difficulty): string {
  return `${buildSnakeBootScript()}
setSnakeDifficulty(${jsString(difficulty)});
`;
}
