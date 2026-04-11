export class AudioManager {
  constructor() {
    this.ctx = null;
    this.sounds = {};
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.masterGain);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);
    this.initialized = true;
  }

  ensureInit() {
    if (!this.initialized) this.init();
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.3, dest = null) {
    this.ensureInit();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest || this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
    return osc;
  }

  playBeep() {
    this.playTone(880, 0.15, 'sine', 0.2);
  }

  playConfirm() {
    this.playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.2), 200);
  }

  playAlert() {
    this.playTone(440, 0.3, 'square', 0.15);
    setTimeout(() => this.playTone(440, 0.3, 'square', 0.15), 400);
  }

  playCountdown() {
    this.playTone(600, 0.2, 'sine', 0.3);
  }

  playLaunchRumble(duration = 5) {
    this.ensureInit();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + duration - 1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    return { source, gain, filter };
  }

  playEngineHum() {
    this.ensureInit();
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    return { osc, gain };
  }

  playDockingBeep() {
    this.playTone(1200, 0.05, 'sine', 0.15);
  }

  playSuccess() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.3, 'sine', 0.2), i * 150);
    });
  }

  playWarning() {
    this.ensureInit();
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 800;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 4;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    lfo.start();
    setTimeout(() => { osc.stop(); lfo.stop(); }, 2000);
  }

  playReEntryRumble(duration = 10) {
    this.ensureInit();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * (0.3 + 0.4 * Math.sin(t * 0.5));
      }
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 3);
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + duration - 2);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    return { source, gain };
  }

  playSpaceAmbience() {
    this.ensureInit();
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 40;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 55;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.04;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain);
    osc1.start();
    osc2.start();
    return { osc1, osc2, gain };
  }

  playRadioStatic(duration = 1) {
    this.ensureInit();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }

  setMusicVolume(v) {
    this.ensureInit();
    this.musicGain.gain.value = v;
  }

  setSFXVolume(v) {
    this.ensureInit();
    this.sfxGain.gain.value = v;
  }

  setMasterVolume(v) {
    this.ensureInit();
    this.masterGain.gain.value = v;
  }
}
