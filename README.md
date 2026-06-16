# Miyagi Metronome

Strike the space.

A metronome that records how accurately you tap against the beat, then shows you where you landed on the pendulum arc. Each tap leaves a coloured mark — the position encodes your timing error directly, no numbers needed.

**[→ kivilcimlab.org/miyagi-metronome](https://kivilcimlab.org/miyagi-metronome)**

---

## Why not `setInterval`

Standard JS timing APIs are subject to event loop throttling — the browser can defer a `setInterval` callback by tens of milliseconds under load, which is catastrophic for rhythmic accuracy.

Miyagi uses the **Web Audio API clock** (`AudioContext.currentTime`) and a lookahead scheduler: beats are scheduled ahead of the render loop, not triggered by it. The audio subsystem runs on a dedicated hardware thread, independent of the main thread's activity.

## Tap accuracy

Perceptual latency of approximately 25ms is subtracted before mapping taps onto the pendulum arc. Without this correction, every tap would appear slightly late even when the user's timing is perfect.

Beat timing uses an **index-based accumulator** (`beat_index * interval`) rather than cumulative addition (`time += interval`). Over long sessions, cumulative floating-point addition drifts. Index-based calculation doesn't.

## The marks

Each tap leaves a mark on the arc at the position corresponding to your timing offset. Up to 100 marks are stored. When the limit is reached, the session is over.

The Gaussian ripple envelope on the wave responds to each tap — the amplitude of the ripple reflects the size of your timing error.

## Stack

- Vanilla JS
- Web Audio API (clock + oscillator scheduling)
- HTML5 Canvas
