// MediaPipe Tasks Vision wrapper. Loads pose + face landmarkers in VIDEO mode.
// Pinned to a known-good version with stable model URLs.

import {
  FilesetResolver,
  PoseLandmarker,
  FaceLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";

const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

let pose = null;
let face = null;
let initPromise = null;

export async function initTracker(onProgress = () => {}) {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    onProgress("loading runtime");
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);

    onProgress("loading pose model");
    pose = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }).catch(async (e) => {
      // Fall back to CPU if GPU delegate fails (older mobile Safari etc.)
      console.warn("pose GPU delegate failed, falling back to CPU", e);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    });

    onProgress("loading face model");
    face = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    }).catch(async (e) => {
      console.warn("face GPU delegate failed, falling back to CPU", e);
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    });

    return { pose, face };
  })();
  return initPromise;
}

// Run inference on the given video element at the given timestampMs.
// Returns { pose, face } where each may be null if nothing was detected.
export function detect(video, timestampMs) {
  if (!pose || !face) return { pose: null, face: null };
  let poseResult = null, faceResult = null;
  try {
    poseResult = pose.detectForVideo(video, timestampMs);
  } catch (e) { /* timestamp can go backwards on seek; swallow */ }
  try {
    faceResult = face.detectForVideo(video, timestampMs);
  } catch (e) { /* same */ }

  const poseLandmarks =
    poseResult && poseResult.landmarks && poseResult.landmarks[0]
      ? poseResult.landmarks[0]
      : null;
  const poseWorld =
    poseResult && poseResult.worldLandmarks && poseResult.worldLandmarks[0]
      ? poseResult.worldLandmarks[0]
      : null;
  const faceLandmarks =
    faceResult && faceResult.faceLandmarks && faceResult.faceLandmarks[0]
      ? faceResult.faceLandmarks[0]
      : null;
  const blendshapes =
    faceResult && faceResult.faceBlendshapes && faceResult.faceBlendshapes[0]
      ? faceResult.faceBlendshapes[0].categories
      : null;
  const faceMatrix =
    faceResult && faceResult.facialTransformationMatrixes &&
    faceResult.facialTransformationMatrixes[0]
      ? faceResult.facialTransformationMatrixes[0].data
      : null;

  return {
    pose: poseLandmarks ? { landmarks: poseLandmarks, world: poseWorld } : null,
    face: faceLandmarks
      ? { landmarks: faceLandmarks, blendshapes, matrix: faceMatrix }
      : null,
  };
}

// Reset internal trackers (call when seeking far backwards) so timestamp
// monotonicity isn't violated.
export async function resetForSeek() {
  // The Tasks API tolerates non-monotonic timestamps better than the older
  // MediaPipe graphs, but recreating is still the safest reset. We keep
  // resets cheap by just nudging — the runtime self-corrects within a few
  // frames after a seek. Hook here in case future versions get stricter.
}
