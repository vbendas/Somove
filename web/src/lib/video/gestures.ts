/**
 * P1 Gesture Controls for Video Sessions (MediaPipe Hands based)
 * 
 * Planned gestures:
 * - Thumbs up (hold 1.5s): zoom in (local preview)
 * - Open palm (hold): zoom out
 * - Wave (3+ side to side): toggle mute
 * - Fist (hold 1.5s): toggle camera
 * 
 * This is a stub. Full implementation requires:
 * npm install @mediapipe/hands @mediapipe/camera-utils
 * 
 * Performance safeguards and capability detection to be added.
 */

export type GestureType = 'thumbs_up' | 'open_palm' | 'wave' | 'fist' | 'none';

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  holdProgress?: number; // 0-1 for hold-to-confirm
}

export class GestureDetector {
  private lastGesture: GestureType = 'none';
  private holdStart: number | null = null;
  private readonly HOLD_DURATION_MS = 1500;

  // Stub: In real impl, process hand landmarks from MediaPipe
  detectFromLandmarks(_landmarks: unknown[]): GestureResult {
    // Placeholder logic - replace with real classifier
    // For now returns 'none' until MediaPipe integrated
    return {
      gesture: "none",
      confidence: 0,
    };
  }

  // Hold-to-confirm helper
  processHold(gesture: GestureType): number {
    const now = Date.now();
    if (gesture !== this.lastGesture) {
      this.lastGesture = gesture;
      this.holdStart = gesture !== 'none' ? now : null;
      return 0;
    }

    if (this.holdStart && gesture !== 'none') {
      const progress = Math.min((now - this.holdStart) / this.HOLD_DURATION_MS, 1);
      return progress;
    }
    return 0;
  }

  reset() {
    this.lastGesture = 'none';
    this.holdStart = null;
  }
}

// Capability detection stub
export function supportsGestures(): boolean {
  // Check for camera + performance (real impl would test fps)
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices;
}
