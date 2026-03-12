// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: circle;

// ── Config ──────────────────────────────────────────
const BIRTHDAY = new Date(2008, 11, 3) // Dec 3, 2008
const LIFESPAN = 100
const COLS = 10
const ROWS = LIFESPAN / COLS

// Auto-calculate age based on birthday
const today = new Date()
let age = today.getFullYear() - BIRTHDAY.getFullYear()
const hadBirthdayThisYear =
  today.getMonth() > BIRTHDAY.getMonth() ||
  (today.getMonth() === BIRTHDAY.getMonth() && today.getDate() >= BIRTHDAY.getDate())
if (!hadBirthdayThisYear) age--

// ── Colors ──────────────────────────────────────────
const BG = new Color("#0a0a0a")
const LIVED = new Color("#e0e0e0")
const EMPTY = new Color("#1a1a1a")
const LABEL = new Color("#555555")
const ACCENT = new Color("#888888")

// ── Widget ──────────────────────────────────────────
const widget = new ListWidget()
widget.backgroundColor = BG
widget.setPadding(12, 12, 12, 12)

// Title
const title = widget.addText("LIFE IN YEARS")
title.font = Font.semiboldSystemFont(9)
title.textColor = LABEL
title.letterSpacing = 1

widget.addSpacer(6)

// Dot grid — square boxes instead of circles
const gridStack = widget.addStack()
gridStack.layoutVertically()
gridStack.centerAlignContent()

const dotSize = 10
const dotGap = 3
const dotRadius = 2

for (let row = 0; row < ROWS; row++) {
  const rowStack = gridStack.addStack()
  rowStack.layoutHorizontally()
  rowStack.centerAlignContent()
  rowStack.spacing = dotGap

  for (let col = 0; col < COLS; col++) {
    const yearIndex = row * COLS + col
    const dot = rowStack.addStack()
    dot.size = new Size(dotSize, dotSize)
    dot.cornerRadius = dotRadius

    if (yearIndex < age) {
      dot.backgroundColor = LIVED
    } else {
      dot.backgroundColor = EMPTY
    }
  }

  if (row < ROWS - 1) gridStack.addSpacer(dotGap)
}

widget.addSpacer(6)

// Stats
const statsStack = widget.addStack()
statsStack.layoutHorizontally()
statsStack.centerAlignContent()

const livedText = statsStack.addText(`${age} lived`)
livedText.font = Font.mediumSystemFont(9)
livedText.textColor = ACCENT

statsStack.addSpacer()

const leftText = statsStack.addText(`${LIFESPAN - age} left`)
leftText.font = Font.mediumSystemFont(9)
leftText.textColor = LABEL

// Refresh daily to catch birthday
widget.refreshAfterDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

// ── Present ─────────────────────────────────────────
if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  await widget.presentSmall()
}

Script.complete()
