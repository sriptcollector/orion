// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: circle;

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
const LIVED = new Color("#c0c0c0")   // silver for lived years
const EMPTY = new Color("#1a2a40")   // dark blue-grey for unlived, blends with background

// ── Widget ──────────────────────────────────────────
const widget = new ListWidget()
widget.backgroundColor = Color.clear()
widget.setPadding(20, 20, 20, 20)

// Dot grid — boxes only, no text
widget.addSpacer(null)

const gridStack = widget.addStack()
gridStack.layoutVertically()
gridStack.centerAlignContent()

const dotSize = 28
const dotGap = 4
const dotRadius = 4

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

widget.addSpacer(null)

// Refresh daily to catch birthday
widget.refreshAfterDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

// ── Present ─────────────────────────────────────────
if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  await widget.presentExtraLarge()
}

Script.complete()
