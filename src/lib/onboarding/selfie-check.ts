/**
 * On-device selfie check for VERIFY-CAPTURE: one face in view and a V sign ("Victory") from a hand.
 * Runs MediaPipe Tasks (WebAssembly) from this site — the runtime is copied to /mediapipe by
 * scripts/copy-mediapipe.mjs and the models live in /models — so camera frames never leave the device.
 * Loaded on demand: nothing is downloaded until the capture screen opens.
 */
const WASM_PATH = "/mediapipe";
const GESTURE_MODEL = "/models/gesture_recognizer.task";
const FACE_MODEL = "/models/blaze_face_short_range.tflite";
const MIN_FACE_SCORE = 0.6;
const MIN_GESTURE_SCORE = 0.6;

/** What the current frame shows. */
export type SelfieSignal = { face: boolean; victory: boolean };

export type SelfieCheck = {
  /** Reads one video frame; `at` must increase between calls (the video's own clock). */
  read: (video: HTMLVideoElement, at: number) => SelfieSignal;
  close: () => void;
};

/** Loads both models; prefers the GPU and falls back to the CPU. Rejects when the browser can't run them. */
export async function createSelfieCheck(): Promise<SelfieCheck> {
  const { FaceDetector, FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  const load = async (delegate: "GPU" | "CPU") =>
    Promise.all([
      GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: GESTURE_MODEL, delegate },
        runningMode: "VIDEO",
        numHands: 2,
      }),
      FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate },
        runningMode: "VIDEO",
        minDetectionConfidence: MIN_FACE_SCORE,
      }),
    ]);
  const [gestures, faces] = await load("GPU").catch(() => load("CPU"));

  return {
    read(video, at) {
      const found = faces.detectForVideo(video, at).detections;
      const face = found.length === 1 && (found[0].categories[0]?.score ?? 0) >= MIN_FACE_SCORE;
      const victory = gestures
        .recognizeForVideo(video, at)
        .gestures.some((hand) => hand[0]?.categoryName === "Victory" && hand[0].score >= MIN_GESTURE_SCORE);
      return { face, victory };
    },
    close() {
      gestures.close();
      faces.close();
    },
  };
}
