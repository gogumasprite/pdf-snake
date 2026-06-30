export const GRID_SIZE = 20;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const ROW_BOARD_COLUMNS = 30;
export const ROW_BOARD_ROWS = 20;

export const PAGE_WIDTH = 900;
export const PAGE_HEIGHT = 506;
export const SPIKE_PAGE_WIDTH = 612;
export const SPIKE_PAGE_HEIGHT = 792;

export const CELL_SIZE = 14;
export const CELL_BOARD_SIZE = GRID_SIZE * CELL_SIZE;
export const LEFT_COLUMN_WIDTH = 330;
export const COLUMN_GAP = 58;
export const RIGHT_COLUMN_WIDTH = 250;
export const CONTENT_WIDTH = LEFT_COLUMN_WIDTH + COLUMN_GAP + RIGHT_COLUMN_WIDTH;
export const CONTENT_X = (PAGE_WIDTH - CONTENT_WIDTH) / 2;
export const CELL_GRID_LEFT = CONTENT_X;
export const CELL_GRID_BOTTOM = 58;
export const CONTROL_PANEL_LEFT = CONTENT_X + LEFT_COLUMN_WIDTH + COLUMN_GAP;
export const SPIKE_CELL_SIZE = 16;
export const SPIKE_CELL_BOARD_SIZE = GRID_SIZE * SPIKE_CELL_SIZE;
export const SPIKE_CELL_GRID_LEFT = (SPIKE_PAGE_WIDTH - SPIKE_CELL_BOARD_SIZE) / 2;
export const SPIKE_CELL_GRID_BOTTOM = 330;

export const BOARD_LEFT = 54;
export const BOARD_TOP = 636;
export const ROW_HEIGHT = 18;
export const ROW_WIDTH = 504;

export const CONTROL_TOP = 198;
export const BUTTON_WIDTH = 82;
export const BUTTON_HEIGHT = 30;

export const OUTPUT_DIRECTORY = 'generated';
export const FINAL_PDF_FILE = 'snake.pdf';
export const DISTRIBUTION_PDF_FILE = 'playable-pdf-snake.pdf';
export const SPIKE_COUNTER_FILE = 'spike1_counter.pdf';
export const SPIKE_MOTION_FILE = 'spike2_motion.pdf';
export const SPIKE_DIRECTION_FILE = 'spike3_direction.pdf';
export const SPIKE_CELL_COLOR_FILE = 'spike4_cell_color.pdf';
export const SPIKE_CELL_TEXT_FILE = 'spike5_cell_text.pdf';

export const FIELD_NAMES = {
  counter: 'counter',
  difficulty: 'difficulty',
  fast: 'fast',
  normal: 'normal',
  score: 'score',
  slow: 'slow',
  status: 'status',
  start: 'start',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
} as const;

export const TICK_MS = 340;
export const SLOW_TICK_MS = 520;
export const NORMAL_TICK_MS = TICK_MS;
export const FAST_TICK_MS = 190;
export const DEATH_ANIMATION_FRAME_MS = 150;
export const DEATH_ANIMATION_FRAME_COUNT = 4;
