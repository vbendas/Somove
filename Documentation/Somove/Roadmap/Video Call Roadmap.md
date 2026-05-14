# Video Call System — Feature Roadmap

## Overview

Two-phase progressive enhancement approach. Phase 1 ships a functional video call system. Phase 2 layers auto-framing on top as an opt-in feature with graceful degradation.

**Note on MVP:** The MVP (defined in [[Product Requirements Document|Product Requirements Document]]) uses Daily.co (not LiveKit) and includes contactless gesture controls via MediaPipe **Hands** — allowing therapist and client to control zoom, mute, volume, and camera from a distance using hand gestures. This roadmap describes the full marketplace video system with LiveKit and auto-framing. The MVP gesture controls (MediaPipe Hands) and the future auto-framing (MoveNet Pose) are independent features — one does not replace or depend on the other.

**Stack:** LiveKit (WebRTC infrastructure) · TensorFlow.js MoveNet Lightning (pose detection) · Canvas API (virtual camera pipeline)

**Target:** Browser-first / PWA · iOS 16+ · No native apps

---

## Architecture Principle

From LiveKit's perspective, both phases are identical — a video track going into a room. The only difference is the track source:

- **Basic:** `camera → LiveKit room`
- **Auto-frame:** `camera → canvas pipeline → LiveKit room`

Phase 1 must be built with a `VideoTrackSource` abstraction so Phase 2 slots in without refactoring.

---

## Phase 1 — Basic Video Call

**Goal:** Therapists and clients can join a session and have a stable, high-quality video call from any modern browser.

**Estimated effort:** 80–100 hours

---

### 1.1 Infrastructure Setup

- [ ] **1.1.1** Provision LiveKit server (LiveKit Cloud or self-hosted on $40/mo VPS)
- [ ] **1.1.2** Configure TURN/STUN for NAT traversal
- [ ] **1.1.3** Set `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers in Next.js config (required for WASM threading in Phase 2 — set now to avoid retrofit)
- [ ] **1.1.4** Set up LiveKit server-side SDK for room token generation
- [ ] **1.1.5** Create environment config (LiveKit URL, API key/secret)

---

### 1.2 Session & Room Management

- [ ] **1.2.1** Design data model: `Session { id, therapistId, clientId, roomName, scheduledAt, status }`
- [ ] **1.2.2** API endpoint: `POST /api/sessions` — create session and generate LiveKit room
- [ ] **1.2.3** API endpoint: `GET /api/sessions/:id/token` — generate participant token (therapist vs client role)
- [ ] **1.2.4** Rooms are ephemeral — destroy room when session ends (LiveKit webhook on `room_finished`)
- [ ] **1.2.5** Session status lifecycle: `scheduled → active → completed`

---

### 1.3 VideoTrackSource Abstraction

- [ ] **1.3.1** Define `VideoTrackSource` interface with `getTrack(): Promise<MediaStreamTrack>` and `destroy(): void`
- [ ] **1.3.2** Implement `CameraTrackSource` — raw `getUserMedia` output
- [ ] **1.3.3** Wire `CameraTrackSource` as default in call hook
- [ ] **1.3.4** Ensure LiveKit connection accepts track from abstraction layer (not directly from `getUserMedia`)

> This abstraction is the only Phase 1 investment that exists purely to enable Phase 2. It adds ~1–2 hours but avoids a full refactor later.

---

### 1.4 Call UI

- [ ] **1.4.1** `/session/[id]` page — main call screen
- [ ] **1.4.2** Local video preview (self-view, small corner tile)
- [ ] **1.4.3** Remote video display (therapist/client main view)
- [ ] **1.4.4** Controls bar: mute audio, toggle video, end call
- [ ] **1.4.5** Connection state indicators (connecting, connected, reconnecting, disconnected)
- [ ] **1.4.6** "Waiting for other participant" holding state
- [ ] **1.4.7** End call confirmation + redirect to post-session screen
- [ ] **1.4.8** Mobile-responsive layout (portrait and landscape)

---

### 1.5 Permissions & Error Handling

- [ ] **1.5.1** Camera/microphone permission request with clear explanation
- [ ] **1.5.2** Graceful error if permissions denied — show instructions per browser/OS
- [ ] **1.5.3** Handle room-not-found, invalid token, expired session errors
- [ ] **1.5.4** Auto-reconnect on transient network drops (LiveKit SDK handles this — ensure UI reflects it)

---

### 1.6 PWA Considerations

- [ ] **1.6.1** Ensure call page works in mobile Safari (iOS 16+ target)
- [ ] **1.6.2** Prevent screen lock during active session (`WakeLock API` where supported)
- [ ] **1.6.3** Test on real iPhone hardware — Safari DevTools emulation is unreliable for WebRTC
- [ ] **1.6.4** Validate `getUserMedia` with PWA manifest `display: standalone`

---

## Phase 2 — Auto-Frame (Opt-In)

**Goal:** Users can opt into intelligent auto-framing that captures wide, detects the full body, and delivers a smooth crop-and-follow view. Falls back silently to basic if unsupported or underperforming.

**Estimated effort:** 60–80 additional hours

---

### 2.1 Capability Detection

- [ ] **2.1.1** Check `HTMLCanvasElement.captureStream` support
- [ ] **2.1.2** Check `RTCRtpSender.replaceTrack` support
- [ ] **2.1.3** Check `navigator.deviceMemory > 2` (GB)
- [ ] **2.1.4** Parse iOS version from user agent — require 16+
- [ ] **2.1.5** Export `canSupportAutoFrame(): boolean` utility used before offering the toggle
- [ ] **2.1.6** If capability check fails, hide the toggle entirely (no broken state presented to user)

---

### 2.2 Pose Detection Pipeline

- [ ] **2.2.1** Install and configure `@tensorflow/tfjs` and `@tensorflow-models/pose-detection`
- [ ] **2.2.2** Load MoveNet Lightning model (smallest, fastest — right for mobile)
- [ ] **2.2.3** Run inference on a hidden `<video>` element fed from raw camera stream
- [ ] **2.2.4** Extract bounding box from keypoints: use shoulders, hips, ankles with configurable padding
- [ ] **2.2.5** Implement frame skipping — run pose detection every 2nd or 3rd frame, interpolate between
- [ ] **2.2.6** Handle no-person-detected case — hold last known crop or slowly zoom out to full frame
- [ ] **2.2.7** Handle multiple people detected — use largest/closest person as subject

---

### 2.3 Crop-and-Follow Logic

- [ ] **2.3.1** Implement exponential smoothing on bounding box coordinates (prevents jitter)
- [ ] **2.3.2** Add configurable padding around bounding box (default: 20% each side)
- [ ] **2.3.3** Clamp crop region to source frame bounds (no out-of-bounds crop)
- [ ] **2.3.4** Implement minimum crop size (never zoom in further than ~50% of frame — avoids extreme close-ups during fast movement)
- [ ] **2.3.5** Draw cropped + scaled region onto output `<canvas>` at target resolution

---

### 2.4 CanvasTrackSource

- [ ] **2.4.1** Implement `CanvasTrackSource` satisfying the `VideoTrackSource` interface from 1.3.1
- [ ] **2.4.2** `getTrack()` returns `canvas.captureStream(30).getVideoTracks()[0]`
- [ ] **2.4.3** Manage lifecycle: start/stop pose detection loop with `requestAnimationFrame`
- [ ] **2.4.4** `destroy()` cancels animation frame, stops canvas stream, releases camera

---

### 2.5 Runtime Performance Monitor

- [ ] **2.5.1** Track rolling average of pose detection frame rate
- [ ] **2.5.2** If fps drops below 15 for 5+ consecutive seconds, trigger fallback
- [ ] **2.5.3** Fallback: swap `CanvasTrackSource` → `CameraTrackSource` via `replaceTrack`
- [ ] **2.5.4** Show subtle non-intrusive notification: "Auto-frame switched off — device performance"
- [ ] **2.5.5** Do not automatically re-enable — user must toggle back on manually

---

### 2.6 User Toggle

- [ ] **2.6.1** Add auto-frame toggle button to call controls bar (only shown if capability check passes)
- [ ] **2.6.2** Default state: **off** (opt-in, never a surprise)
- [ ] **2.6.3** Persist preference in `localStorage` — remember choice across sessions
- [ ] **2.6.4** Smooth transition when enabling: fade canvas track in, don't snap
- [ ] **2.6.5** Show brief onboarding tooltip on first toggle explaining what it does

---

### 2.7 Testing & Validation

- [ ] **2.7.1** Test canvas pipeline on iPhone 12, 13, 14 (real hardware)
- [ ] **2.7.2** Test fallback trigger on throttled CPU (Chrome DevTools)
- [ ] **2.7.3** Validate `replaceTrack` in Safari — remote participant should see clean transition
- [ ] **2.7.4** Test no-person scenario (user steps out of frame)
- [ ] **2.7.5** Test rapid movement scenario (somatic exercises — fast lateral movement)
- [ ] **2.7.6** Validate COOP/COEP headers allow WASM threading (check `crossOriginIsolated === true`)

---

## Infrastructure Sizing

| Stage | Therapists | Recommendation | Est. Cost |
|---|---|---|---|
| Launch | 2 | LiveKit Cloud free tier | $0/mo |
| Beta | 10 | LiveKit Cloud pay-as-you-go | ~$150–400/mo |
| Growth | 50+ | Self-hosted LiveKit (4 vCPU / 8GB) | ~$60/mo |

Sessions are ephemeral — rooms created per session, destroyed on end. No persistent room state to manage.

---

## Fallback Decision Tree

```
User opens session page
        ↓
canSupportAutoFrame()?
   No  → Basic only, no toggle shown
   Yes → Show toggle (default: off)
        ↓
User enables auto-frame
        ↓
CanvasTrackSource starts
        ↓
Runtime fps monitor running
   fps < 15 for 5s → swap to CameraTrackSource + notify user
   fps OK → continue
        ↓
User toggles off manually → swap to CameraTrackSource, persist preference
```

---

## Decisions (Resolved)

| Decision | Answer |
|---|---|
| Scheduling | Fully end-to-end within Somove — sessions provisioned via Cal.com + Stripe webhook pipeline |
| Session recording | Permanently out of scope. LiveKit must not be configured for recording |
| Auto-frame toggle | Per-session, preference persisted in localStorage across sessions |
| HIPAA | Not in scope — Europe only |
| Data residency | LiveKit server must be hosted in EU region |
| Session chat | Any session-scoped chat messages deleted when session ends |
