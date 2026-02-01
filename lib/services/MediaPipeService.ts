import { FaceDetector, FilesetResolver, Detection } from "@mediapipe/tasks-vision";

export class MediaPipeService {
    private static instance: MediaPipeService;
    private faceDetector: FaceDetector | null = null;
    private lastVideoTime = -1;

    private constructor() { }

    public static getInstance(): MediaPipeService {
        if (!MediaPipeService.instance) {
            MediaPipeService.instance = new MediaPipeService();
        }
        return MediaPipeService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.faceDetector) return;

        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            this.faceDetector = await FaceDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
            });
            console.log("MediaPipe FaceDetector initialized");
        } catch (error) {
            console.error("Failed to initialize MediaPipe FaceDetector:", error);
            throw error;
        }
    }

    public detect(videoElement: HTMLVideoElement): Detection[] {
        if (!this.faceDetector) {
            console.warn("FaceDetector not initialized");
            return [];
        }

        if (videoElement.currentTime !== this.lastVideoTime) {
            if (
                !videoElement.videoWidth ||
                !videoElement.videoHeight ||
                videoElement.videoWidth === 0 ||
                videoElement.videoHeight === 0
            ) {
                return [];
            }
            this.lastVideoTime = videoElement.currentTime;
            const detections = this.faceDetector.detectForVideo(
                videoElement,
                performance.now()
            );
            return detections.detections;
        }
        return [];
    }
}
