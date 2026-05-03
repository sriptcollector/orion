// Top-level glue. Wires the file picker to a video element, drives a per-frame
// inference loop on top of MediaPipe (tracker.js), funnels landmarks into
// heuristics (signals.js), paints the overlay (overlay.js), and maintains a
// timeline strip + side-panel readout.

import { initTracker, detect } from "./tracker.js";
import { computeSignals, SIGNAL_COLORS } from "./signals.js";
import {
  resizeCanvas,
  clear,
  drawPose,
  drawFace,
  drawTells,
} from "./overlay.js";

// --- DOM refs ---
const $ = (sel) => document.querySelector(sel);
const video = $("#video");
const overlay = $("#overlay");
const overlayCtx = overlay.getContext("2d");
const fileInput = $("#file");
const playBtn = $("#play");
const back10 = $("#back10");
const fwd10 = $("#fwd10");
const rateSel = $("#rate");
const timeEl = $("#time");
const empty = $("#empty");
const loading = $("#loading");
const loadingText = $("#loading-text");
const timeline = $("#timeline");
const tlCanvas = $("#timeline-canvas");
const tlCtx = tlCanvas.getContext("2d");
const playhead = $("#playhead");
const signalsList = $("#signals");
const tellsEl = $("#tells");
const flagBtn = $("#flag");
const clearMomentsBtn = $("#clear-moments");
const momentsEl = $("#moments");
const analyzeBtn = $("#analyze");

// --- State ---
const state = {
  ready: false,
  loadingTracker: false,
  smoothed: null,        // last smoothed signals
  // bucketed timeline data: Map<bucketIndex, { alignment, openness, tension, engagement, valence, n }>
  buckets: new Map(),
  bucketSize: 0.25,      // seconds per bucket
  duration: 0,
  lastTs: 0,             // monotonic timestamp for MediaPipe (ms)
  moments: [],
  preAnalyzing: false,
  cancelPreAnalyze: false,
};

// --- Utility ---
const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

function nextMonotonicTs() {
  // The MediaPipe Tasks API needs strictly increasing timestamps. We keep
  // our own monotonic clock so seeks (which can move currentTime backwards)
  // don't blow up inference.
  state.lastTs += 33; // ~30fps stride; actual frame timing is captured in mediaTime
  return state.lastTs;
}

function bucketIndex(t) {
  return Math.floor(t / state.bucketSize);
}

function recordToBucket(t, sig) {
  const i = bucketIndex(t);
  const cur = state.buckets.get(i);
  if (cur) {
    // Running average so re-watching doesn't keep ratcheting numbers.
    const n = cur.n + 1;
    cur.alignment = (cur.alignment * cur.n + sig.alignment) / n;
    cur.openness = (cur.openness * cur.n + sig.openness) / n;
    cur.tension = (cur.tension * cur.n + sig.tension) / n;
    cur.engagement = (cur.engagement * cur.n + sig.engagement) / n;
    cur.valence = (cur.valence * cur.n + sig.valence) / n;
    cur.n = n;
  } else {
    state.buckets.set(i, { ...sig, n: 1 });
  }
}

// --- File loading ---
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  video.src = url;
  empty.classList.add("hidden");
  await new Promise((res) => {
    video.addEventListener("loadedmetadata", res, { once: true });
  });
  state.duration = video.duration;
  state.buckets.clear();
  state.smoothed = null;
  state.lastTs = 0;
  state.moments = [];
  renderMoments();
  renderTimeline();
  flagBtn.disabled = false;
  analyzeBtn.disabled = false;
  resizeCanvasesToVideo();
  updateTimeDisplay();
  await ensureTracker();
});

async function ensureTracker() {
  if (state.ready || state.loadingTracker) return;
  state.loadingTracker = true;
  loading.classList.remove("hidden");
  try {
    await initTracker((label) => {
      loadingText.textContent = label + "…";
    });
    state.ready = true;
  } catch (e) {
    console.error(e);
    loadingText.textContent = "couldn't load models — check your connection";
    return;
  } finally {
    state.loadingTracker = false;
    setTimeout(() => loading.classList.add("hidden"), 200);
  }
}

// --- Playback controls ---
playBtn.addEventListener("click", () => {
  if (!video.src) return;
  if (video.paused) video.play(); else video.pause();
});
video.addEventListener("play", () => (playBtn.textContent = "❚❚"));
video.addEventListener("pause", () => (playBtn.textContent = "▶"));
video.addEventListener("ended", () => (playBtn.textContent = "▶"));

back10.addEventListener("click", () => seekBy(-10));
fwd10.addEventListener("click", () => seekBy(10));
rateSel.addEventListener("change", () => { video.playbackRate = parseFloat(rateSel.value); });

function seekBy(dt) {
  if (!isFinite(video.duration)) return;
  video.currentTime = Math.min(Math.max(0, video.currentTime + dt), video.duration);
}

video.addEventListener("timeupdate", updateTimeDisplay);
video.addEventListener("durationchange", () => {
  state.duration = video.duration;
  updateTimeDisplay();
});

function updateTimeDisplay() {
  const cur = video.currentTime || 0;
  const dur = state.duration || video.duration || 0;
  timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
  if (dur > 0) {
    playhead.style.left = `${(cur / dur) * 100}%`;
  } else {
    playhead.style.left = "0";
  }
}

// --- Timeline scrubbing ---
function pointerToTime(ev) {
  const r = timeline.getBoundingClientRect();
  const x = (ev.clientX ?? (ev.touches && ev.touches[0]?.clientX) ?? r.left) - r.left;
  const pct = Math.max(0, Math.min(1, x / r.width));
  return pct * (state.duration || 0);
}

let scrubbing = false;
timeline.addEventListener("pointerdown", (e) => {
  if (!isFinite(video.duration)) return;
  scrubbing = true;
  timeline.setPointerCapture(e.pointerId);
  video.currentTime = pointerToTime(e);
});
timeline.addEventListener("pointermove", (e) => {
  if (!scrubbing) return;
  video.currentTime = pointerToTime(e);
});
timeline.addEventListener("pointerup", (e) => {
  scrubbing = false;
  try { timeline.releasePointerCapture(e.pointerId); } catch {}
});

// --- Resize handling ---
function resizeCanvasesToVideo() {
  resizeCanvas(overlay);
  resizeCanvas(tlCanvas);
  renderTimeline();
}
window.addEventListener("resize", () => {
  resizeCanvasesToVideo();
});

// --- The actual inference + render loop ---
// We prefer requestVideoFrameCallback (one call per displayed frame) and fall
// back to requestAnimationFrame on browsers that don't have it.
function startRenderLoop() {
  const useRVFC = typeof video.requestVideoFrameCallback === "function";
  let lastFrameMs = 0;

  const onFrame = (now, metadata) => {
    // Throttle inference to ~24 fps to leave headroom for slower phones.
    const heavy = (now - lastFrameMs) > 38;
    if (state.ready && (heavy || video.paused)) {
      lastFrameMs = now;
      runInference(video.currentTime);
    } else {
      // Still re-render the overlay each animation frame so timeline/playhead
      // stay smooth even when we skip inference.
      paintOverlayFromLast();
    }

    if (useRVFC) {
      video.requestVideoFrameCallback(onFrame);
    } else {
      requestAnimationFrame((t) => onFrame(t));
    }
  };

  if (useRVFC) {
    video.requestVideoFrameCallback(onFrame);
  } else {
    requestAnimationFrame((t) => onFrame(t));
  }
}

let lastDetection = { pose: null, face: null, signals: null };

function runInference(mediaTimeSec) {
  const ts = nextMonotonicTs();
  const det = detect(video, ts);
  const sig = computeSignals(det.pose, det.face, state.smoothed);
  state.smoothed = sig;
  lastDetection = { ...det, signals: sig };

  if (!isFinite(mediaTimeSec)) mediaTimeSec = video.currentTime || 0;
  recordToBucket(mediaTimeSec, sig);

  paintOverlay(det, sig);
  renderPanel(sig);
  renderTimelineIncremental(mediaTimeSec, sig);
}

function paintOverlayFromLast() {
  if (!lastDetection || !lastDetection.signals) return;
  paintOverlay(lastDetection, lastDetection.signals);
}

function paintOverlay(det, sig) {
  if (!video.videoWidth) return;
  if (overlay.width !== overlay.clientWidth * (window.devicePixelRatio || 1) ||
      overlay.height !== overlay.clientHeight * (window.devicePixelRatio || 1)) {
    resizeCanvas(overlay);
  }
  clear(overlayCtx, overlay);
  drawPose(overlayCtx, overlay, video, det.pose, sig);
  drawFace(overlayCtx, overlay, video, det.face, sig);
  drawTells(overlayCtx, overlay, sig?.tells || []);
}

// --- Side-panel rendering ---
function renderPanel(sig) {
  for (const li of signalsList.querySelectorAll("li")) {
    const key = li.dataset.key;
    const valEl = li.querySelector(".val");
    const fill = li.querySelector(".fill");
    if (key === "valence") {
      const v = sig.valence; // [-1,1]
      valEl.textContent = (v >= 0 ? "+" : "") + v.toFixed(2);
      const half = 50; // %
      if (v >= 0) {
        fill.style.left = "50%";
        fill.style.right = `${50 - v * half}%`;
      } else {
        fill.style.left = `${50 + v * half}%`;
        fill.style.right = "50%";
      }
    } else {
      const v = sig[key];
      valEl.textContent = `${Math.round(v * 100)}%`;
      fill.style.right = `${(1 - v) * 100}%`;
    }
  }

  if (!sig.tells || sig.tells.length === 0) {
    tellsEl.innerHTML = `<li class="muted">no strong tells</li>`;
  } else {
    tellsEl.innerHTML = sig.tells
      .map(
        (t) =>
          `<li><span>${t.label}</span><span class="tell-tag">${t.kind}</span></li>`,
      )
      .join("");
  }
}

// --- Timeline rendering ---
const STRIP_KEYS = ["alignment", "openness", "tension", "engagement", "valence"];

function renderTimeline() {
  // Full repaint — used on resize / load / pre-analyze completion.
  resizeCanvas(tlCanvas);
  const w = tlCanvas.width, h = tlCanvas.height;
  tlCtx.clearRect(0, 0, w, h);

  if (!state.duration) return;

  const padY = 6;
  const stripGap = 2 * (window.devicePixelRatio || 1);
  const stripH = (h - padY * 2 - stripGap * 4) / 5;

  // Background guide.
  tlCtx.fillStyle = "rgba(255,255,255,0.02)";
  tlCtx.fillRect(0, 0, w, h);

  for (let s = 0; s < STRIP_KEYS.length; s++) {
    const key = STRIP_KEYS[s];
    const yTop = padY + s * (stripH + stripGap);
    drawStrip(key, yTop, stripH);
  }
}

function drawStrip(key, yTop, stripH) {
  const w = tlCanvas.width, h = tlCanvas.height;
  const totalBuckets = Math.max(1, Math.ceil(state.duration / state.bucketSize));
  const baseColor = SIGNAL_COLORS[key];

  // Faint baseline.
  tlCtx.fillStyle = "rgba(255,255,255,0.025)";
  tlCtx.fillRect(0, yTop, w, stripH);

  // Paint each pixel column by sampling the bucket(s) that fall inside it.
  for (let x = 0; x < w; x++) {
    const t0 = (x / w) * state.duration;
    const t1 = ((x + 1) / w) * state.duration;
    const i0 = Math.floor(t0 / state.bucketSize);
    const i1 = Math.max(i0, Math.floor(t1 / state.bucketSize));
    let sum = 0, n = 0;
    for (let i = i0; i <= i1; i++) {
      const b = state.buckets.get(i);
      if (b) { sum += b[key]; n++; }
    }
    if (n === 0) continue;
    const v = sum / n;
    let alpha;
    if (key === "valence") {
      alpha = Math.min(1, Math.abs(v));
    } else {
      alpha = Math.min(1, v);
    }
    tlCtx.fillStyle = withAlpha(baseColor, 0.15 + alpha * 0.85);
    tlCtx.fillRect(x, yTop, 1, stripH);
  }

  // Strip label.
  tlCtx.fillStyle = "rgba(232,232,238,0.55)";
  tlCtx.font = `${10 * (window.devicePixelRatio || 1)}px -apple-system, system-ui, sans-serif`;
  tlCtx.textBaseline = "middle";
  tlCtx.fillText(key, 6 * (window.devicePixelRatio || 1), yTop + stripH / 2);
}

function withAlpha(hex, a) {
  // hex is "#rrggbb"
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Cheap incremental update — repaints just the pixel column under the
// playhead so live playback keeps the strip filling in.
function renderTimelineIncremental(t, sig) {
  if (!state.duration) return;
  const w = tlCanvas.width, h = tlCanvas.height;
  const x = Math.floor((t / state.duration) * w);
  const padY = 6;
  const stripGap = 2 * (window.devicePixelRatio || 1);
  const stripH = (h - padY * 2 - stripGap * 4) / 5;
  for (let s = 0; s < STRIP_KEYS.length; s++) {
    const key = STRIP_KEYS[s];
    const yTop = padY + s * (stripH + stripGap);
    const v = key === "valence" ? Math.abs(sig.valence) : sig[key];
    tlCtx.fillStyle = "rgba(0,0,0,0.6)";
    tlCtx.fillRect(x, yTop, 1, stripH);
    tlCtx.fillStyle = withAlpha(SIGNAL_COLORS[key], 0.15 + Math.min(1, v) * 0.85);
    tlCtx.fillRect(x, yTop, 1, stripH);
  }
}

// --- Moments (flagged timestamps with a one-line "why") ---
flagBtn.addEventListener("click", () => {
  const t = video.currentTime || 0;
  const sig = state.smoothed;
  let why = "flagged";
  if (sig && sig.tells && sig.tells.length) {
    why = sig.tells.slice(0, 2).map((t) => t.label).join(" + ");
  }
  state.moments.push({ t, why });
  state.moments.sort((a, b) => a.t - b.t);
  renderMoments();
});
clearMomentsBtn.addEventListener("click", () => {
  state.moments = [];
  renderMoments();
});

function renderMoments() {
  if (state.moments.length === 0) {
    momentsEl.innerHTML = "";
    return;
  }
  momentsEl.innerHTML = state.moments
    .map(
      (m, i) => `
      <li data-i="${i}">
        <span><span class="ts">${fmtTime(m.t)}</span> <span class="note">· ${escapeHtml(m.why)}</span></span>
        <span class="x" data-del="${i}">×</span>
      </li>`,
    )
    .join("");
}

momentsEl.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  const delAttr = e.target.getAttribute("data-del");
  if (delAttr !== null) {
    state.moments.splice(parseInt(delAttr, 10), 1);
    renderMoments();
    return;
  }
  const i = parseInt(li.dataset.i, 10);
  if (!isNaN(i) && state.moments[i]) {
    video.currentTime = state.moments[i].t;
  }
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

// --- Pre-analyze full clip ---
analyzeBtn.addEventListener("click", async () => {
  if (!isFinite(video.duration)) return;
  if (state.preAnalyzing) {
    state.cancelPreAnalyze = true;
    return;
  }
  state.preAnalyzing = true;
  state.cancelPreAnalyze = false;
  analyzeBtn.textContent = "stop pre-analysis";
  await ensureTracker();
  const wasPlaying = !video.paused;
  video.pause();

  const startedAt = video.currentTime;
  const stride = 0.4; // seconds — coarse pass to fill the strip fast
  let smoothed = null;

  for (let t = 0; t < video.duration; t += stride) {
    if (state.cancelPreAnalyze) break;
    await seekTo(t);
    const ts = nextMonotonicTs();
    const det = detect(video, ts);
    const sig = computeSignals(det.pose, det.face, smoothed);
    smoothed = sig;
    recordToBucket(t, sig);
    paintOverlay(det, sig);
    renderPanel(sig);
    analyzeBtn.textContent = `analyzing… ${Math.round((t / video.duration) * 100)}%`;
  }

  renderTimeline();
  await seekTo(startedAt);
  if (wasPlaying) video.play();
  state.preAnalyzing = false;
  analyzeBtn.textContent = "Pre-analyze full clip";
});

function seekTo(t) {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      // Wait one extra frame to make sure the decoded frame is paintable.
      requestAnimationFrame(() => resolve());
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = Math.max(0, Math.min(video.duration, t));
  });
}

// --- Boot ---
resizeCanvasesToVideo();
startRenderLoop();
