import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
  type Color,
  PDFDocument,
  PDFField,
  PDFName,
  PDFString,
  StandardFonts,
  TextAlignment,
  rgb,
} from 'pdf-lib';
import {
  BOARD_LEFT,
  BOARD_TOP,
  BUTTON_HEIGHT,
  BUTTON_WIDTH,
  CELL_GRID_BOTTOM,
  CELL_GRID_LEFT,
  CELL_SIZE,
  CONTROL_TOP,
  CONTROL_PANEL_LEFT,
  CONTENT_X,
  DISTRIBUTION_PDF_FILE,
  FIELD_NAMES,
  FINAL_PDF_FILE,
  GRID_SIZE,
  OUTPUT_DIRECTORY,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  ROW_BOARD_COLUMNS,
  ROW_BOARD_ROWS,
  ROW_HEIGHT,
  ROW_WIDTH,
  SPIKE_CELL_GRID_BOTTOM,
  SPIKE_CELL_GRID_LEFT,
  SPIKE_CELL_SIZE,
  SPIKE_CELL_COLOR_FILE,
  SPIKE_CELL_TEXT_FILE,
  SPIKE_COUNTER_FILE,
  SPIKE_DIRECTION_FILE,
  SPIKE_MOTION_FILE,
  SPIKE_PAGE_HEIGHT,
  SPIKE_PAGE_WIDTH,
} from './constants.js';
import {
  buildCellColorSpikeScript,
  buildCellTextSpikeScript,
  buildCounterScript,
  buildDirectionButtonScript,
  buildMotionScript,
  buildSnakeDifficultyScript,
  buildSnakeDirectionScript,
  buildSnakeStartScript,
} from './game_script.js';

type TextFieldOptions = {
  name: string;
  backgroundColor?: Color;
  borderColor?: Color;
  borderWidth?: number;
  label?: string;
  textColor?: Color;
  value?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  alignment?: TextAlignment;
  readOnly?: boolean;
};

async function createDocument(title: string): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor('pdf-snake-generator');
  pdfDoc.setSubject('Playable AcroForm PDF generated with TypeScript and pdf-lib');
  return pdfDoc;
}

function addJavaScriptAction(field: PDFField, script: string): void {
  const acroField = field.acroField;
  const action = acroField.dict.context.obj({
    S: PDFName.of('JavaScript'),
    JS: PDFString.of(script),
  });
  const widgets = acroField.getWidgets();
  for (const widget of widgets) {
    widget.dict.set(PDFName.of('A'), action);
  }
}

async function addTextField(
  pdfDoc: PDFDocument,
  options: TextFieldOptions,
): Promise<void> {
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const field = form.createTextField(options.name);
  field.setText(options.value ?? '');
  if (options.readOnly ?? true) {
    field.enableReadOnly();
  }
  field.addToPage(page, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    textColor: options.textColor ?? rgb(0.04, 0.08, 0.05),
    backgroundColor: options.backgroundColor ?? rgb(0.95, 0.98, 0.93),
    borderColor: options.borderColor ?? rgb(0.35, 0.45, 0.35),
    borderWidth: options.borderWidth ?? 1,
    font,
  });
  field.setFontSize(options.fontSize ?? 13);
  if (options.alignment !== undefined) {
    field.setAlignment(options.alignment);
  }
  if (options.label) {
    page.drawText(options.label, {
      x: options.x,
      y: options.y + options.height + 5,
      size: 9,
      color: rgb(0.2, 0.25, 0.2),
    });
  }
}

function addButton(
  pdfDoc: PDFDocument,
  name: string,
  label: string,
  x: number,
  y: number,
  script: string,
  width = BUTTON_WIDTH,
  height = BUTTON_HEIGHT,
): void {
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];
  const button = form.createButton(name);
  button.addToPage(label, page, {
    x,
    y,
    width,
    height,
    textColor: rgb(1, 1, 1),
    backgroundColor: rgb(0.1, 0.32, 0.16),
    borderColor: rgb(0.04, 0.12, 0.06),
    borderWidth: 1,
  });
  addJavaScriptAction(button, script);
}

async function addBasePage(pdfDoc: PDFDocument, title: string): Promise<void> {
  const page = pdfDoc.addPage([SPIKE_PAGE_WIDTH, SPIKE_PAGE_HEIGHT]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SPIKE_PAGE_WIDTH,
    height: SPIKE_PAGE_HEIGHT,
    color: rgb(0.91, 0.93, 0.88),
  });
  page.drawText(title, {
    x: 54,
    y: 724,
    size: 22,
    color: rgb(0.05, 0.16, 0.08),
  });
  page.drawText('Chrome desktop PDF viewer / AcroForm JavaScript', {
    x: 54,
    y: 704,
    size: 10,
    color: rgb(0.24, 0.28, 0.24),
  });
}

async function addSnakePage(pdfDoc: PDFDocument): Promise<void> {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.91, 0.93, 0.88),
  });
  page.drawText('PDF SNAKE', {
    x: CONTENT_X,
    y: 460,
    size: 24,
    color: rgb(0.05, 0.16, 0.08),
  });
  page.drawText('A playable Snake game running inside a PDF file.', {
    x: CONTENT_X,
    y: 439,
    size: 10,
    color: rgb(0.18, 0.24, 0.18),
  });
  page.drawText('Works best in Chrome desktop PDF viewer.', {
    x: CONTENT_X,
    y: 424,
    size: 10,
    color: rgb(0.18, 0.24, 0.18),
  });
  page.drawText('Snake: @ / O   Food: X', {
    x: CONTENT_X,
    y: 409,
    size: 10,
    color: rgb(0.18, 0.24, 0.18),
  });

  page.drawText('Click START, then use the D-pad.', {
    x: CONTROL_PANEL_LEFT,
    y: 460,
    size: 11,
    color: rgb(0.18, 0.24, 0.18),
  });
}

async function addBoardRows(pdfDoc: PDFDocument, initialRows?: string[]): Promise<void> {
  for (let row = 0; row < ROW_BOARD_ROWS; row += 1) {
    await addTextField(pdfDoc, {
      name: `row_${row}`,
      value: initialRows?.[row] ?? '.'.repeat(ROW_BOARD_COLUMNS),
      x: BOARD_LEFT,
      y: BOARD_TOP - row * ROW_HEIGHT,
      width: ROW_WIDTH,
      height: ROW_HEIGHT,
      fontSize: 12,
      readOnly: true,
    });
  }
}

async function addCellGrid(pdfDoc: PDFDocument): Promise<void> {
  await addCellGridAt(pdfDoc, SPIKE_CELL_GRID_LEFT, SPIKE_CELL_GRID_BOTTOM, SPIKE_CELL_SIZE);
}

async function addPublicCellGrid(pdfDoc: PDFDocument): Promise<void> {
  await addCellGridAt(pdfDoc, CELL_GRID_LEFT, CELL_GRID_BOTTOM, CELL_SIZE, {
    staticGrid: true,
  });
}

async function addCellGridAt(
  pdfDoc: PDFDocument,
  gridLeft: number,
  gridBottom: number,
  cellSize: number,
  options?: {staticGrid?: boolean},
): Promise<void> {
  const page = pdfDoc.getPages()[0];
  const boardSize = GRID_SIZE * cellSize;
  page.drawRectangle({
    x: gridLeft - 8,
    y: gridBottom - 8,
    width: boardSize + 16,
    height: boardSize + 16,
    color: rgb(0.2, 0.28, 0.19),
  });
  page.drawRectangle({
    x: gridLeft - 3,
    y: gridBottom - 3,
    width: boardSize + 6,
    height: boardSize + 6,
    color: rgb(0.54, 0.64, 0.46),
  });
  page.drawRectangle({
    x: gridLeft,
    y: gridBottom,
    width: boardSize,
    height: boardSize,
    color: rgb(0.9, 0.97, 0.86),
  });
  if (options?.staticGrid) {
    const lineColor = rgb(0.48, 0.6, 0.42);
    for (let index = 0; index <= GRID_SIZE; index += 1) {
      const offset = index * cellSize;
      page.drawLine({
        start: {x: gridLeft + offset, y: gridBottom},
        end: {x: gridLeft + offset, y: gridBottom + boardSize},
        thickness: index === 0 || index === GRID_SIZE ? 1.2 : 0.45,
        color: lineColor,
      });
      page.drawLine({
        start: {x: gridLeft, y: gridBottom + offset},
        end: {x: gridLeft + boardSize, y: gridBottom + offset},
        thickness: index === 0 || index === GRID_SIZE ? 1.2 : 0.45,
        color: lineColor,
      });
    }
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const inset = options?.staticGrid ? 1 : 0;
      await addTextField(pdfDoc, {
        name: `cell_${row}_${col}`,
        value: '',
        x: gridLeft + col * cellSize + inset,
        y: gridBottom + (GRID_SIZE - row - 1) * cellSize + inset,
        width: cellSize - inset * 2,
        height: cellSize - inset * 2,
        fontSize: Math.max(12, cellSize - 2),
        alignment: TextAlignment.Center,
        readOnly: true,
        textColor: rgb(0.03, 0.12, 0.05),
        backgroundColor: rgb(0.9, 0.97, 0.86),
        borderColor: rgb(0.9, 0.97, 0.86),
        borderWidth: options?.staticGrid ? 0 : 0.25,
      });
    }
  }
}

async function addScoreAndStatus(pdfDoc: PDFDocument): Promise<void> {
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.score,
    label: 'Score',
    value: '0',
    x: 54,
    y: 248,
    width: 90,
    height: 24,
    readOnly: true,
  });
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.status,
    label: 'Status',
    value: 'READY - Click START | Difficulty: NORMAL',
    x: 154,
    y: 248,
    width: 280,
    height: 24,
    readOnly: true,
  });
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.difficulty,
    label: 'Difficulty',
    value: 'NORMAL',
    x: 454,
    y: 248,
    width: 104,
    height: 24,
    readOnly: true,
  });
}

async function addLandscapeScoreAndStatus(pdfDoc: PDFDocument): Promise<void> {
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.score,
    label: 'Score',
    value: '0',
    x: CONTROL_PANEL_LEFT,
    y: 391,
    width: 88,
    height: 24,
    readOnly: true,
  });
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.difficulty,
    label: 'Difficulty',
    value: 'NORMAL',
    x: CONTROL_PANEL_LEFT + 106,
    y: 391,
    width: 116,
    height: 24,
    readOnly: true,
  });
}

function addGameButtons(
  pdfDoc: PDFDocument,
  startScript: string,
  directionScript: (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => string,
  difficultyScript?: (difficulty: 'SLOW' | 'NORMAL' | 'FAST') => string,
): void {
  addButton(pdfDoc, FIELD_NAMES.start, 'START', 42, 78, startScript, 136, 72);
  addButton(pdfDoc, FIELD_NAMES.up, 'UP', 262, 134, directionScript('UP'), 84, 32);
  addButton(pdfDoc, FIELD_NAMES.left, 'LEFT', 172, 96, directionScript('LEFT'), 84, 32);
  addButton(pdfDoc, FIELD_NAMES.right, 'RIGHT', 352, 96, directionScript('RIGHT'), 84, 32);
  addButton(pdfDoc, FIELD_NAMES.down, 'DOWN', 262, 58, directionScript('DOWN'), 84, 32);
  if (difficultyScript) {
    addButton(pdfDoc, FIELD_NAMES.slow, 'SLOW', 372, 154, difficultyScript('SLOW'), 62, 28);
    addButton(
      pdfDoc,
      FIELD_NAMES.normal,
      'NORMAL',
      442,
      154,
      difficultyScript('NORMAL'),
      82,
      28,
    );
    addButton(pdfDoc, FIELD_NAMES.fast, 'FAST', 532, 154, difficultyScript('FAST'), 62, 28);
  }
}

function addLandscapeGameButtons(
  pdfDoc: PDFDocument,
  startScript: string,
  directionScript: (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => string,
  difficultyScript: (difficulty: 'SLOW' | 'NORMAL' | 'FAST') => string,
): void {
  addButton(pdfDoc, FIELD_NAMES.start, 'START', CONTROL_PANEL_LEFT, 320, startScript, 128, 38);
  addButton(pdfDoc, FIELD_NAMES.up, 'UP', CONTROL_PANEL_LEFT + 86, 263, directionScript('UP'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.left, 'LEFT', CONTROL_PANEL_LEFT + 22, 227, directionScript('LEFT'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.right, 'RIGHT', CONTROL_PANEL_LEFT + 150, 227, directionScript('RIGHT'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.down, 'DOWN', CONTROL_PANEL_LEFT + 86, 191, directionScript('DOWN'), 58, 28);
  addButton(pdfDoc, FIELD_NAMES.slow, 'SLOW', CONTROL_PANEL_LEFT, 118, difficultyScript('SLOW'), 64, 26);
  addButton(
    pdfDoc,
    FIELD_NAMES.normal,
    'NORMAL',
    CONTROL_PANEL_LEFT + 76,
    118,
    difficultyScript('NORMAL'),
    78,
    26,
  );
  addButton(pdfDoc, FIELD_NAMES.fast, 'FAST', CONTROL_PANEL_LEFT + 166, 118, difficultyScript('FAST'), 64, 26);
}

async function savePdf(pdfDoc: PDFDocument, fileName: string): Promise<string> {
  const outputDirectory = path.resolve(OUTPUT_DIRECTORY);
  await mkdir(outputDirectory, {recursive: true});
  const outputPath = path.join(outputDirectory, fileName);
  const bytes = await pdfDoc.save({updateFieldAppearances: true});
  await writeFile(outputPath, bytes);
  return outputPath;
}

async function generateCounterSpike(): Promise<string> {
  const pdfDoc = await createDocument('Spike 1 - Counter Button');
  await addBasePage(pdfDoc, 'Spike 1: button increments counter field');
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.counter,
    label: 'Counter',
    value: '0',
    x: 54,
    y: 626,
    width: 120,
    height: 28,
    readOnly: true,
  });
  addButton(pdfDoc, FIELD_NAMES.start, 'COUNT', 196, 626, buildCounterScript());
  return savePdf(pdfDoc, SPIKE_COUNTER_FILE);
}

async function generateMotionSpike(): Promise<string> {
  const pdfDoc = await createDocument('Spike 2 - Moving Rows');
  await addBasePage(pdfDoc, 'Spike 2: START animates row text fields');
  await addBoardRows(pdfDoc);
  addButton(pdfDoc, FIELD_NAMES.start, 'START', 54, CONTROL_TOP, buildMotionScript());
  return savePdf(pdfDoc, SPIKE_MOTION_FILE);
}

async function generateDirectionSpike(): Promise<string> {
  const pdfDoc = await createDocument('Spike 3 - Direction Buttons');
  await addBasePage(pdfDoc, 'Spike 3: direction buttons update status');
  await addScoreAndStatus(pdfDoc);
  addGameButtons(pdfDoc, buildCounterScript(), buildDirectionButtonScript);
  return savePdf(pdfDoc, SPIKE_DIRECTION_FILE);
}

async function generateCellColorSpike(): Promise<string> {
  const pdfDoc = await createDocument('Spike 4 - Cell Color');
  await addBasePage(pdfDoc, 'Spike 4: button changes one cell color');
  await addCellGrid(pdfDoc);
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.status,
    label: 'Status',
    value: 'Click TOGGLE to recolor the center cell',
    x: 54,
    y: 248,
    width: 360,
    height: 24,
    readOnly: true,
  });
  addButton(pdfDoc, FIELD_NAMES.start, 'TOGGLE', 434, 248, buildCellColorSpikeScript());
  return savePdf(pdfDoc, SPIKE_CELL_COLOR_FILE);
}

async function generateCellTextSpike(): Promise<string> {
  const pdfDoc = await createDocument('Spike 5 - Cell Text');
  await addBasePage(pdfDoc, 'Spike 5: button changes one cell text');
  await addCellGrid(pdfDoc);
  await addTextField(pdfDoc, {
    name: FIELD_NAMES.status,
    label: 'Status',
    value: 'Click TOGGLE to cycle empty, snake, and food text',
    x: 54,
    y: 248,
    width: 380,
    height: 24,
    readOnly: true,
  });
  addButton(pdfDoc, FIELD_NAMES.start, 'TOGGLE', 444, 248, buildCellTextSpikeScript(), 92, 30);
  return savePdf(pdfDoc, SPIKE_CELL_TEXT_FILE);
}

async function generateSnakePdfs(): Promise<string[]> {
  const pdfDoc = await createDocument('PDF Snake');
  await addSnakePage(pdfDoc);
  await addPublicCellGrid(pdfDoc);
  await addLandscapeScoreAndStatus(pdfDoc);
  addLandscapeGameButtons(
    pdfDoc,
    buildSnakeStartScript(),
    buildSnakeDirectionScript,
    buildSnakeDifficultyScript,
  );
  return [
    await savePdf(pdfDoc, FINAL_PDF_FILE),
    await savePdf(pdfDoc, DISTRIBUTION_PDF_FILE),
  ];
}

async function main(): Promise<void> {
  const outputs = [
    await generateCounterSpike(),
    await generateMotionSpike(),
    await generateDirectionSpike(),
    await generateCellColorSpike(),
    await generateCellTextSpike(),
    ...(await generateSnakePdfs()),
  ];

  for (const output of outputs) {
    console.log(`Generated ${output}`);
  }

  if (process.argv.includes('--verify')) {
    const distributionOutput = outputs.find((output) =>
      output.endsWith(DISTRIBUTION_PDF_FILE),
    );
    if (!distributionOutput) {
      throw new Error(`Missing generated ${DISTRIBUTION_PDF_FILE}`);
    }
    const finalBytes = await PDFDocument.load(
      await import('node:fs/promises').then((fs) => fs.readFile(distributionOutput)),
    );
    const pageSize = finalBytes.getPage(0).getSize();
    if (
      Math.round(pageSize.width) !== PAGE_WIDTH ||
      Math.round(pageSize.height) !== PAGE_HEIGHT
    ) {
      throw new Error(
        `Unexpected public PDF size: ${pageSize.width} x ${pageSize.height}`,
      );
    }
    const form = finalBytes.getForm();
    const fieldNames = form.getFields().map((field) => field.getName());
    const requiredFields = [
      FIELD_NAMES.score,
      FIELD_NAMES.difficulty,
      FIELD_NAMES.start,
      FIELD_NAMES.up,
      FIELD_NAMES.down,
      FIELD_NAMES.left,
      FIELD_NAMES.right,
      FIELD_NAMES.slow,
      FIELD_NAMES.normal,
      FIELD_NAMES.fast,
      ...Array.from({length: GRID_SIZE}, (_, row) =>
        Array.from({length: GRID_SIZE}, (_, col) => `cell_${row}_${col}`),
      ).flat(),
    ];
    for (const fieldName of requiredFields) {
      if (!fieldNames.includes(fieldName)) {
        throw new Error(`Missing required field: ${fieldName}`);
      }
    }
    if (fieldNames.includes(FIELD_NAMES.status)) {
      throw new Error('Public PDF should not contain a Status field.');
    }
    if (!outputs.some((output) => output.endsWith(SPIKE_CELL_TEXT_FILE))) {
      throw new Error(`Missing generated ${SPIKE_CELL_TEXT_FILE}`);
    }
    const finalSnakeScript = buildSnakeStartScript();
    const requiredRendererSnippets = [
      "'@'",
      "'O'",
      "'X'",
      "'x'",
      "'GAME'",
      "'OVER'",
      "'CLEAR'",
      'emptyCells',
    ];
    for (const snippet of requiredRendererSnippets) {
      if (!finalSnakeScript.includes(snippet)) {
        throw new Error(`Missing final renderer snippet: ${snippet}`);
      }
    }
    const forbiddenHeadSnippets = [
      "headCharacter",
      "return '^'",
      "return 'v'",
      "return '<'",
      "return '>'",
    ];
    for (const snippet of forbiddenHeadSnippets) {
      if (finalSnakeScript.includes(snippet)) {
        throw new Error(`Forbidden directional head renderer snippet: ${snippet}`);
      }
    }
    const forbiddenFoodSpawnSnippets = ['while (', 'while('];
    for (const snippet of forbiddenFoodSpawnSnippets) {
      if (finalSnakeScript.includes(snippet)) {
        throw new Error(`Forbidden food spawn loop snippet: ${snippet}`);
      }
    }
    console.log(`Verified ${requiredFields.length} required fields.`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
