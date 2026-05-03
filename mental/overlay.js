// Canvas overlay drawing — skeleton, face mesh, attention markers.
// All coordinates are normalized [0,1] from MediaPipe; we map them into the
// canvas using object-fit: contain semantics (the video is letterboxed inside
// the player), so we compute the rendered video rect first.

const POSE_CONNECTIONS = [
  // torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // arms
  [11, 13], [13, 15], [12, 14], [14, 16],
  // legs
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
  // face cross
  [9, 10],
];

function videoRect(video, canvas) {
  const cw = canvas.width, ch = canvas.height;
  const vw = video.videoWidth || cw, vh = video.videoHeight || ch;
  const scale = Math.min(cw / vw, ch / vh);
  const w = vw * scale, h = vh * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

export function resizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  return dpr;
}

export function clear(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawPose(ctx, canvas, video, pose, signals) {
  if (!pose || !pose.landmarks) return;
  const r = videoRect(video, canvas);
  const L = pose.landmarks;
  const tense = signals?.tension ?? 0;
  const open = signals?.openness ?? 0.5;

  const skelColor = `rgba(${Math.round(108 + tense * 147)}, ${Math.round(242 - tense * 110)}, ${Math.round(200 - tense * 120)}, 0.85)`;

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = skelColor;
  ctx.shadowColor = skelColor;
  ctx.shadowBlur = 8;

  for (const [a, b] of POSE_CONNECTIONS) {
    const pa = L[a], pb = L[b];
    if (!pa || !pb) continue;
    if ((pa.visibility ?? 1) < 0.3 || (pb.visibility ?? 1) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo(r.x + pa.x * r.w, r.y + pa.y * r.h);
    ctx.lineTo(r.x + pb.x * r.w, r.y + pb.y * r.h);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Joint dots, sized by importance.
  const importantJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24];
  for (const i of importantJoints) {
    const p = L[i];
    if (!p) continue;
    if ((p.visibility ?? 1) < 0.3) continue;
    dot(ctx, r.x + p.x * r.w, r.y + p.y * r.h, 4, "#ffffff");
  }

  // Shoulder-line emphasis indicates posture tilt.
  const lSh = L[11], rSh = L[12];
  if (lSh && rSh) {
    ctx.strokeStyle = `rgba(255,255,255,0.25)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + ((lSh.y + rSh.y) / 2) * r.h);
    ctx.lineTo(r.x + r.w, r.y + ((lSh.y + rSh.y) / 2) * r.h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hand reticles — animated rings around wrists scale with hand activity.
  for (const wi of [15, 16]) {
    const w = L[wi];
    if (!w || (w.visibility ?? 1) < 0.3) continue;
    const cx = r.x + w.x * r.w, cy = r.y + w.y * r.h;
    const rad = 14 + Math.sin(performance.now() / 240 + wi) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(116, 184, 255, ${0.4 + open * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function drawFace(ctx, canvas, video, face, signals) {
  if (!face || !face.landmarks) return;
  const r = videoRect(video, canvas);
  const valence = signals?.valence ?? 0;
  const tense = signals?.tension ?? 0;

  // Mesh as faint dots — keeps it readable.
  ctx.fillStyle = `rgba(180, 200, 220, 0.5)`;
  for (let i = 0; i < face.landmarks.length; i += 2) {
    const p = face.landmarks[i];
    ctx.fillRect(r.x + p.x * r.w - 0.5, r.y + p.y * r.h - 0.5, 1.2, 1.2);
  }

  // Bounding "head crown" — a halo whose color reflects valence.
  const xs = face.landmarks.map((p) => p.x);
  const ys = face.landmarks.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx = r.x + ((x0 + x1) / 2) * r.w;
  const cy = r.y + ((y0 + y1) / 2) * r.h;
  const rad = Math.max((x1 - x0) * r.w, (y1 - y0) * r.h) / 1.7;

  const halo =
    valence >= 0
      ? `rgba(108, 242, 200, ${0.15 + valence * 0.5})`
      : `rgba(255, 122, 122, ${0.15 + Math.abs(valence) * 0.5})`;

  const grad = ctx.createRadialGradient(cx, cy, rad * 0.7, cx, cy, rad * 1.3);
  grad.addColorStop(0, halo);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, rad * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Tension cross-hairs at brow and jaw when high.
  if (tense > 0.5) {
    ctx.strokeStyle = `rgba(255, 122, 122, ${(tense - 0.4) * 1.2})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(r.x + x0 * r.w, r.y + (y0 + (y1 - y0) * 0.18) * r.h);
    ctx.lineTo(r.x + x1 * r.w, r.y + (y0 + (y1 - y0) * 0.18) * r.h);
    ctx.moveTo(r.x + x0 * r.w, r.y + (y0 + (y1 - y0) * 0.85) * r.h);
    ctx.lineTo(r.x + x1 * r.w, r.y + (y0 + (y1 - y0) * 0.85) * r.h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawTells(ctx, canvas, tells) {
  if (!tells || tells.length === 0) return;
  ctx.save();
  ctx.font = "12px -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  ctx.textBaseline = "top";
  let y = 12;
  for (const t of tells) {
    const text = `· ${t.label}`;
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(12, y, w, 22);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, 19, y + 5);
    y += 26;
  }
  ctx.restore();
}
