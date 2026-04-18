/**
 * Procedural audio using Web Audio API — generates all sounds synthetically
 * so we don't need any binary audio asset files.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private hornOsc: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  public enabled = false;

  constructor() {}

  /** Call from a user gesture (click/key) to initialize AudioContext. */
  start() {
    if (this.enabled) return;
    try {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);

      this.setupEngine();
      this.setupAmbient();
      this.enabled = true;
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  }

  private setupEngine() {
    if (!this.ctx || !this.masterGain) return;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 600;
    this.engineFilter.Q.value = 2;

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 60;
    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();
  }

  private setupAmbient() {
    if (!this.ctx || !this.masterGain) return;
    // Brown-noise-ish ambient city sound
    const bufSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    this.ambientNoise = this.ctx.createBufferSource();
    this.ambientNoise.buffer = buffer;
    this.ambientNoise.loop = true;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.08;
    this.ambientNoise.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientNoise.start();
  }

  /** RPM-ish: 0 idle, 1 redline. */
  setEngineRPM(rpm01: number, isRunning: boolean) {
    if (!this.enabled || !this.engineOsc || !this.engineGain || !this.engineFilter) return;
    const target = isRunning ? 0.08 + rpm01 * 0.25 : 0;
    this.engineGain.gain.setTargetAtTime(target, this.ctx!.currentTime, 0.05);
    const freq = 50 + rpm01 * 160;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx!.currentTime, 0.05);
    this.engineFilter.frequency.setTargetAtTime(400 + rpm01 * 1400, this.ctx!.currentTime, 0.08);
  }

  honk(durationMs = 450) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.hornOsc) {
      try { this.hornOsc.stop(); } catch {} // already stopped
    }
    this.hornOsc = this.ctx.createOscillator();
    this.hornGain = this.ctx.createGain();
    this.hornOsc.type = 'square';
    this.hornOsc.frequency.value = 330;
    this.hornGain.gain.value = 0.0;
    this.hornGain.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.01);
    this.hornGain.gain.setTargetAtTime(0.0, this.ctx.currentTime + durationMs / 1000, 0.04);
    this.hornOsc.connect(this.hornGain);
    this.hornGain.connect(this.masterGain);
    this.hornOsc.start();
    this.hornOsc.stop(this.ctx.currentTime + durationMs / 1000 + 0.2);
  }

  beep(freq = 880, duration = 0.12, volume = 0.2) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.005);
    gain.gain.setTargetAtTime(0, this.ctx.currentTime + duration * 0.7, 0.02);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.1);
  }

  success() { this.beep(660, 0.1); setTimeout(() => this.beep(990, 0.18), 120); }
  warning() { this.beep(440, 0.08, 0.25); setTimeout(() => this.beep(330, 0.12, 0.25), 90); }

  /** Pump sound for gas station. */
  pump(durationMs: number) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const bufSize = this.ctx.sampleRate * (durationMs / 1000);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4 * Math.sin(i * 0.0008);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.5;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }
}
