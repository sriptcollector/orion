// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: circle;

// ── Config ──────────────────────────────────────────
const AGE = 17
const LIFESPAN = 100
const COLS = 10
const ROWS = LIFESPAN / COLS

// ── Colors ──────────────────────────────────────────
const BG = new Color("#0a0a0a")
const LIVED = new Color("#e0e0e0")
const EMPTY = new Color("#1a1a1a")
const LABEL = new Color("#555555")
const ACCENT = new Color("#888888")

// ── Widget ──────────────────────────────────────────
const widget = new ListWidget()
widget.backgroundColor = BG
widget.setPadding(16, 16, 16, 16)

// Title
const title = widget.addText("LIFE IN YEARS")
title.font = Font.semiboldSystemFont(10)
title.textColor = LABEL
title.letterSpacing = 1

widget.addSpacer(10)

// Dot grid
const gridStack = widget.addStack()
gridStack.layoutVertically()
gridStack.centerAlignContent()

for (let row = 0; row < ROWS; row++) {
  const rowStack = gridStack.addStack()
  rowStack.layoutHorizontally()
  rowStack.centerAlignContent()
  rowStack.spacing = 4

  for (let col = 0; col < COLS; col++) {
    const yearIndex = row * COLS + col
    const dotStack = rowStack.addStack()
    const dotSize = config.widgetFamily === "small" ? 5 : 7
    dotStack.size = new Size(dotSize, dotSize)
    dotStack.cornerRadius = dotSize / 2

    if (yearIndex < AGE) {
      dotStack.backgroundColor = LIVED
    } else {
      dotStack.backgroundColor = EMPTY
    }
  }

  if (row < ROWS - 1) gridStack.addSpacer(4)
}

widget.addSpacer(10)

// Stats
const statsStack = widget.addStack()
statsStack.layoutHorizontally()
statsStack.centerAlignContent()

const livedText = statsStack.addText(`${AGE} lived`)
livedText.font = Font.mediumSystemFont(10)
livedText.textColor = ACCENT

statsStack.addSpacer()

const leftText = statsStack.addText(`${LIFESPAN - AGE} left`)
leftText.font = Font.mediumSystemFont(10)
leftText.textColor = LABEL

// ── Present ─────────────────────────────────────────
if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  await widget.presentMedium()
}

Script.complete()
