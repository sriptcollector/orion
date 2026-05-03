// Heuristics that turn pose + face-blendshape data into "mentalist" signals.
// All outputs are clamped to [0, 1] except `valence` which is in [-1, 1].
// Read the comments before believing the numbers — these are signals, not facts.

const POSE_IDX = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  mouthLeft: 9,
  mouthRight: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
};

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Pull a blendshape score by ARKit name. Returns 0 if missing.
function bs(blendshapes, name) {
  if (!blendshapes) return 0;
  for (let i = 0; i < blendshapes.length; i++) {
    if (blendshapes[i].categoryName === name) return blendshapes[i].score;
  }
  return 0;
}

function avg(...xs) { return xs.reduce((a, b) => a + b, 0) / xs.length; }

// Map a number from [inMin..inMax] -> [0..1] with clamping.
const norm = (v, inMin, inMax) => clamp((v - inMin) / (inMax - inMin));

export function computeSignals(pose, face, prev) {
  const out = {
    alignment: 0,
    openness: 0,
    tension: 0,
    engagement: 0,
    valence: 0,
    tells: [],
    detail: {},
  };

  // ---- POSTURE-DERIVED ----
  let openness = 0.5;
  let postureSymmetry = 0.5;
  let shoulderTension = 0;
  let armsCrossed = false;
  let handsHidden = false;

  if (pose && pose.landmarks) {
    const L = pose.landmarks;
    const lSh = L[POSE_IDX.leftShoulder];
    const rSh = L[POSE_IDX.rightShoulder];
    const lHip = L[POSE_IDX.leftHip];
    const rHip = L[POSE_IDX.rightHip];
    const lWr = L[POSE_IDX.leftWrist];
    const rWr = L[POSE_IDX.rightWrist];
    const lEar = L[POSE_IDX.leftEar];
    const rEar = L[POSE_IDX.rightEar];
    const nose = L[POSE_IDX.nose];

    const shoulderWidth = Math.abs(lSh.x - rSh.x);
    const shoulderMidX = (lSh.x + rSh.x) / 2;
    const torsoTop = (lSh.y + rSh.y) / 2;
    const torsoBot = (lHip && rHip) ? (lHip.y + rHip.y) / 2 : torsoTop + 0.3;
    const torsoH = Math.max(0.05, torsoBot - torsoTop);

    // Arms-crossed: both wrists sit between the shoulders horizontally and at
    // chest height. We don't assume which shoulder is image-left vs. right —
    // selfie-mirrored video would otherwise flip the test.
    const xL = Math.min(lSh.x, rSh.x);
    const xR = Math.max(lSh.x, rSh.x);
    const wristsBothInner = lWr.x > xL && lWr.x < xR && rWr.x > xL && rWr.x < xR;
    const wristsAtChestHeight =
      lWr.y > torsoTop && lWr.y < torsoBot &&
      rWr.y > torsoTop && rWr.y < torsoBot;
    armsCrossed = wristsBothInner && wristsAtChestHeight;

    // Hands hidden — wrists offscreen or far below frame.
    handsHidden = (lWr.visibility !== undefined && lWr.visibility < 0.3) &&
                  (rWr.visibility !== undefined && rWr.visibility < 0.3);

    // Openness: span of wrists relative to shoulder width, plus penalty for crossed arms.
    const wristSpan = Math.abs(lWr.x - rWr.x);
    const spanRatio = wristSpan / Math.max(shoulderWidth, 0.05);
    let openRaw = norm(spanRatio, 0.4, 1.6);
    if (armsCrossed) openRaw *= 0.25;
    if (handsHidden) openRaw *= 0.7;
    openness = openRaw;

    // Posture symmetry: shoulder tilt + body lean (nose vs shoulder mid).
    const shoulderTilt = Math.abs(lSh.y - rSh.y) / Math.max(shoulderWidth, 0.05);
    const lean = Math.abs(nose.x - shoulderMidX) / Math.max(shoulderWidth, 0.05);
    postureSymmetry = clamp(1 - shoulderTilt * 1.5 - lean * 0.6);

    // Shoulder tension: shoulders raised toward ears.
    if (lEar && rEar) {
      const earY = (lEar.y + rEar.y) / 2;
      const shY = (lSh.y + rSh.y) / 2;
      const neckLen = (shY - earY) / torsoH; // smaller = shoulders hunched up
      shoulderTension = clamp(1 - norm(neckLen, 0.6, 1.6));
    }

    out.detail.shoulderWidth = shoulderWidth;
    out.detail.spanRatio = spanRatio;
    out.detail.armsCrossed = armsCrossed;
  } else {
    // Without a pose, openness is unknown; bias toward middle so we don't lie.
    openness = 0.5;
    postureSymmetry = 0.5;
  }

  // ---- FACE-DERIVED (blendshape coefficients in [0,1]) ----
  let smile = 0, frown = 0, browDown = 0, browUp = 0, lipPress = 0;
  let eyeOpen = 1, eyeWide = 0, eyeSquint = 0, jawOpen = 0, jawForward = 0;
  let noseSneer = 0, mouthPucker = 0, mouthClose = 0;
  let asymSmile = 0, asymBrow = 0;
  let headYaw = 0, headPitch = 0;

  if (face && face.blendshapes) {
    const B = face.blendshapes;
    const sL = bs(B, "mouthSmileLeft");
    const sR = bs(B, "mouthSmileRight");
    const fL = bs(B, "mouthFrownLeft");
    const fR = bs(B, "mouthFrownRight");
    const bdL = bs(B, "browDownLeft");
    const bdR = bs(B, "browDownRight");
    const buInner = bs(B, "browInnerUp");
    const buOL = bs(B, "browOuterUpLeft");
    const buOR = bs(B, "browOuterUpRight");
    const blinkL = bs(B, "eyeBlinkLeft");
    const blinkR = bs(B, "eyeBlinkRight");
    const wideL = bs(B, "eyeWideLeft");
    const wideR = bs(B, "eyeWideRight");
    const sqL = bs(B, "eyeSquintLeft");
    const sqR = bs(B, "eyeSquintRight");
    const pressL = bs(B, "mouthPressLeft");
    const pressR = bs(B, "mouthPressRight");
    const sneerL = bs(B, "noseSneerLeft");
    const sneerR = bs(B, "noseSneerRight");

    smile = (sL + sR) / 2;
    frown = (fL + fR) / 2;
    browDown = (bdL + bdR) / 2;
    browUp = (buInner + (buOL + buOR) / 2) / 2;
    lipPress = (pressL + pressR) / 2;
    eyeWide = (wideL + wideR) / 2;
    eyeSquint = (sqL + sqR) / 2;
    eyeOpen = clamp(1 - (blinkL + blinkR) / 2);
    jawOpen = bs(B, "jawOpen");
    jawForward = bs(B, "jawForward");
    noseSneer = (sneerL + sneerR) / 2;
    mouthPucker = bs(B, "mouthPucker");
    mouthClose = bs(B, "mouthClose");

    asymSmile = Math.abs(sL - sR);
    asymBrow = Math.abs(bdL - bdR) + Math.abs(buOL - buOR) * 0.5;
  }

  // Head pose (yaw/pitch) from the 4x4 transformation matrix.
  // Matrix is column-major OpenGL form. We extract Euler-y (yaw) and Euler-x (pitch).
  if (face && face.matrix && face.matrix.length === 16) {
    const m = face.matrix;
    // m00=m[0], m01=m[4], m02=m[8]
    // m10=m[1], m11=m[5], m12=m[9]
    // m20=m[2], m21=m[6], m22=m[10]
    const m20 = m[2], m21 = m[6], m22 = m[10];
    headPitch = Math.atan2(-m21, Math.sqrt(m20 * m20 + m22 * m22));
    headYaw = Math.atan2(m20, m22);
  }

  // ---- COMPOSITE SIGNALS ----

  // Tension: brow load + lip press + jaw forward + sneer + shoulder elevation.
  const faceTension =
    browDown * 0.55 +
    lipPress * 0.6 +
    jawForward * 0.4 +
    noseSneer * 0.4 +
    mouthClose * 0.25;
  const tension = clamp(faceTension * 0.7 + shoulderTension * 0.4);

  // Engagement: eyes open, head facing camera, body present.
  const facing = clamp(1 - Math.abs(headYaw) / 1.0 - Math.abs(headPitch) / 1.0);
  const engagement = clamp(
    eyeOpen * 0.5 + facing * 0.4 + (face ? 0.1 : 0) + (pose ? 0.1 : 0) - 0.1,
  );

  // Valence: smile minus frown / brow-down. Range [-1, 1].
  const valence = clamp(
    (smile * 1.1) - frown * 1.0 - browDown * 0.6 + browUp * 0.15,
    -1, 1
  );

  // Alignment: how coherent the body+face signals are.
  // High when: low facial asymmetry, low postural lean, congruent valence with openness,
  // and tension isn't fighting an "open" posture.
  const incongruence =
    asymSmile * 1.4 +
    asymBrow * 0.8 +
    Math.abs(openness - clamp(0.5 + valence * 0.5)) * 0.6 +
    Math.abs(tension - 0.3) * (openness > 0.6 ? 0.4 : 0);
  const alignment = clamp(
    postureSymmetry * 0.55 +
    (1 - clamp(incongruence)) * 0.55 -
    0.1
  );

  out.openness = clamp(openness);
  out.tension = clamp(tension);
  out.engagement = engagement;
  out.valence = valence;
  out.alignment = alignment;

  // ---- TELLS ---- short human-readable callouts that surface when strong.
  const tells = [];
  if (armsCrossed) tells.push({ label: "arms crossed", weight: 0.9, kind: "guarded" });
  if (handsHidden) tells.push({ label: "hands hidden", weight: 0.6, kind: "guarded" });
  if (smile > 0.55 && asymSmile > 0.2) tells.push({ label: "asymmetric smile", weight: smile, kind: "mixed" });
  if (smile > 0.45 && eyeSquint < 0.05) tells.push({ label: "smile w/o eye squint", weight: smile, kind: "social" });
  if (lipPress > 0.4) tells.push({ label: "lip press", weight: lipPress, kind: "withholding" });
  if (browDown > 0.4 && asymBrow > 0.25) tells.push({ label: "asymmetric brow furrow", weight: browDown, kind: "doubt" });
  if (browUp > 0.5 && eyeWide > 0.35) tells.push({ label: "raised brows + wide eyes", weight: browUp, kind: "surprise" });
  if (jawForward > 0.35) tells.push({ label: "jaw forward", weight: jawForward, kind: "resolve" });
  if (noseSneer > 0.3) tells.push({ label: "nose sneer", weight: noseSneer, kind: "contempt" });
  if (mouthPucker > 0.4) tells.push({ label: "lips pucker", weight: mouthPucker, kind: "skeptical" });
  if (Math.abs(headYaw) > 0.5) tells.push({ label: "averted gaze (yaw)", weight: Math.abs(headYaw), kind: "evasive" });
  if (postureSymmetry < 0.4) tells.push({ label: "leaning / off-balance", weight: 1 - postureSymmetry, kind: "unsettled" });
  if (shoulderTension > 0.6) tells.push({ label: "shoulders raised", weight: shoulderTension, kind: "stress" });
  if (eyeOpen < 0.3) tells.push({ label: "eyes closing", weight: 1 - eyeOpen, kind: "withdrawing" });

  tells.sort((a, b) => b.weight - a.weight);
  out.tells = tells.slice(0, 4);

  // ---- TEMPORAL SMOOTHING ---- exponential moving average against prev.
  if (prev) {
    const a = 0.45; // higher = snappier
    out.alignment = lerp(prev.alignment, out.alignment, a);
    out.openness = lerp(prev.openness, out.openness, a);
    out.tension = lerp(prev.tension, out.tension, a);
    out.engagement = lerp(prev.engagement, out.engagement, a);
    out.valence = lerp(prev.valence, out.valence, a);
  }

  out.detail.smile = smile;
  out.detail.frown = frown;
  out.detail.browDown = browDown;
  out.detail.headYaw = headYaw;
  out.detail.headPitch = headPitch;
  out.detail.eyeOpen = eyeOpen;

  return out;
}

// Color the timeline strip uses for each metric.
export const SIGNAL_COLORS = {
  alignment: "#6cf2c8",
  openness: "#74b8ff",
  tension: "#ff7a7a",
  engagement: "#ffd166",
  valence: "#c69bff",
};
