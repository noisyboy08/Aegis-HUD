// Procedural Sci-Fi Audio Synthesizer using Web Audio API
// Fully self-contained, offline-compatible, and safe for Server-Side Rendering (SSR)

let audioCtx: AudioContext | null = null;

// Initialize or resume AudioContext on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    // Support standard and legacy webkit browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

// Generate a 1-second white noise buffer for explosive sounds
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;

  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  noiseBuffer = buffer;
  return noiseBuffer;
}

// Synthesize laser firing sound
export function playLaser() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Oscillator for core tone (quick pitch sweep)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(950, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

  // 2. High-pass filter to make it sound sharp
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.16);
  filter.Q.value = 1.0;

  // 3. Amplitude envelope
  oscGain.gain.setValueAtTime(0.18, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  // Connect nodes
  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(ctx.destination);

  // Play
  osc.start(now);
  osc.stop(now + 0.2);
}

// Synthesize shield impact explosion
export function playShieldImpact() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // --- Element A: Low Frequency Bass Rumble ---
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(160, now);
  subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
  
  subGain.gain.setValueAtTime(0.4, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  
  subOsc.start(now);
  subOsc.stop(now + 0.35);

  // --- Element B: High Sizzle Noise Burst ---
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(ctx);
  
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1800, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.2);
  noiseFilter.Q.value = 2.0;
  
  noiseGain.gain.setValueAtTime(0.25, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseSource.start(now);
  noiseSource.stop(now + 0.3);
}

// Synthesize energetic shield reveal/charging hum sweep
export function playShieldReveal() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.9;

  // 1. Core Carrier Oscillator
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + duration);

  // LFO to create vibrating charge sound
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 16; // 16 Hz oscillation
  lfoGain.gain.value = 15;   // modulate frequency by +/- 15 Hz
  
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  // 2. High Pass Filter for brightness ramp
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(100, now);
  filter.frequency.exponentialRampToValueAtTime(450, now + duration);
  
  // 3. Amplitude ramp up then quick fade out
  oscGain.gain.setValueAtTime(0.001, now);
  oscGain.gain.linearRampToValueAtTime(0.2, now + duration * 0.75);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(ctx.destination);

  lfo.start(now);
  osc.start(now);
  
  lfo.stop(now + duration);
  osc.stop(now + duration);
}

// Synthesize heavy Plasma Blast shooting sound
export function playPlasma() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.45;

  // 1. Bass sweep oscillator
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(320, now);
  subOsc.frequency.exponentialRampToValueAtTime(30, now + duration);

  // 2. Low-frequency rumbling noise component
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(ctx);
  
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(80, now);
  
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // 3. Amplitude envelope for bass sweep
  subGain.gain.setValueAtTime(0.45, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect sub
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  // Connect noise
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  subOsc.start(now);
  noiseSource.start(now);

  subOsc.stop(now + duration);
  noiseSource.stop(now + duration);
}

// Synthesize rapid EMP high-voltage electric zap sound
export function playEmp() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.28;

  // 1. High frequency carrier oscillator
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1900, now);
  osc.frequency.exponentialRampToValueAtTime(450, now + duration);

  // 2. High-speed FM modulation for electrical crackle
  const fmOsc = ctx.createOscillator();
  const fmGain = ctx.createGain();
  fmOsc.type = 'sawtooth';
  fmOsc.frequency.value = 140; // 140Hz speed
  fmGain.gain.value = 400;     // modulate by +/- 400Hz

  fmOsc.connect(fmGain);
  fmGain.connect(osc.frequency);

  // 3. Filter sweep
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2200, now);
  filter.frequency.exponentialRampToValueAtTime(600, now + duration);
  filter.Q.value = 3.0;

  // 4. Amplitude envelope with rapid decay
  oscGain.gain.setValueAtTime(0.2, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect nodes
  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(ctx.destination);

  fmOsc.start(now);
  osc.start(now);

  fmOsc.stop(now + duration);
  osc.stop(now + duration);
}

