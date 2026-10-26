/**
 * Breakbones Procedural Web Audio Sound Engine
 * Synthesizes bone crunches, flesh impacts, wind whooshes, board wheels, glass shatters, and energetic basslines.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private rollNode: AudioBufferSourceNode | null = null;
  private rollGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initContinuousLoopNoise();
    } catch {
      // Audio not supported or blocked
    }
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initContinuousLoopNoise() {
    if (!this.ctx || !this.sfxGain) return;
    
    // Wind noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Pink/Brownish noise
      lastOut = data[i];
    }

    // Wind filter & gain
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 600;
    windFilter.Q.value = 1.8;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);
    windSource.start(0);
    this.windNode = windSource;

    // Skateboard rolling noise
    const rollSource = this.ctx.createBufferSource();
    rollSource.buffer = buffer;
    rollSource.loop = true;
    const rollFilter = this.ctx.createBiquadFilter();
    rollFilter.type = 'lowpass';
    rollFilter.frequency.value = 280;

    this.rollGain = this.ctx.createGain();
    this.rollGain.gain.value = 0;
    rollSource.connect(rollFilter);
    rollFilter.connect(this.rollGain);
    this.rollGain.connect(this.sfxGain);
    rollSource.start(0);
    this.rollNode = rollSource;
  }

  public setSpeedSounds(speed: number, inAir: boolean, vehicle: string) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Wind volume proportional to speed and height
    if (this.windGain) {
      const windTarget = inAir ? Math.min(0.65, (speed / 30) * 0.6) : Math.min(0.25, (speed / 40) * 0.25);
      this.windGain.gain.setTargetAtTime(windTarget, now, 0.08);
    }

    // Skateboard/BMX rolling rumble on ground
    if (this.rollGain) {
      const isRollingVehicle = vehicle === 'skateboard' || vehicle === 'cart' || vehicle === 'bmx';
      const rollTarget = (!inAir && isRollingVehicle && speed > 1) 
        ? Math.min(0.35, (speed / 25) * 0.3) 
        : 0;
      this.rollGain.gain.setTargetAtTime(rollTarget, now, 0.05);
    }
  }

  /**
   * Visceral Hall of Meat Bone Break sound: snappy high-frequency crack + low punch
   */
  public playBoneSnap(severity: 'light' | 'heavy' | 'shatter' = 'heavy') {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. High frequency brittle snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(severity === 'shatter' ? 1400 : 950, now);
    snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

    snapGain.gain.setValueAtTime(0.8, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.07);

    // 2. Bone crunch burst (filtered noise)
    const crunchBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.18, this.ctx.sampleRate);
    const data = crunchBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const crunchSource = this.ctx.createBufferSource();
    crunchSource.buffer = crunchBuffer;

    const crunchFilter = this.ctx.createBiquadFilter();
    crunchFilter.type = 'bandpass';
    crunchFilter.frequency.setValueAtTime(800, now);
    crunchFilter.Q.value = 3.5;

    const crunchGain = this.ctx.createGain();
    const crunchVol = severity === 'shatter' ? 0.9 : 0.6;
    crunchGain.gain.setValueAtTime(crunchVol, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    crunchSource.connect(crunchFilter);
    crunchFilter.connect(crunchGain);
    crunchGain.connect(this.sfxGain);
    crunchSource.start(now);

    // 3. Sub thump for heavy impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.15);
  }

  /**
   * Flesh / body impact thud
   */
  public playImpactThud(intensity: number = 0.5) {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140 * Math.min(1.5, intensity), now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    gain.gain.setValueAtTime(Math.min(1, 0.4 + intensity * 0.5), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Glass Shatter sound (when crashing through windows/skylights)
   */
  public playGlassShatter() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const count = 4;
    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const freq = 2200 + Math.random() * 2500;
      osc.frequency.setValueAtTime(freq, now + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + i * 0.02 + 0.25);

      gain.gain.setValueAtTime(0.3, now + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.02);
      osc.stop(now + i * 0.02 + 0.26);
    }
  }

  /**
   * Wood Splinter / Scaffolding snap
   */
  public playWoodSnap() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 200, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(80, now + i * 0.03 + 0.1);

      gain.gain.setValueAtTime(0.5, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.1);
    }
  }

  /**
   * Jump / Ollie sound
   */
  public playJump(vehicle: string = 'foot') {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (vehicle === 'skateboard') {
      // Crisp deck snap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else {
      // Foot jump whoosh / grunt
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Pose Switch mid-air swoosh (Cannonball, Spread Eagle, etc.)
   */
  public playPoseSwoosh() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Cash register / Bill Ka-Ching sound for Hall of Meat hospital tally
   */
  public playKaChing() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const freqs = [987.77, 1318.51, 1975.53];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);

      gain.gain.setValueAtTime(0.3, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.32);
    });
  }

  /**
   * Cannon / Springboard blast
   */
  public playLauncherBlast() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Dynamic skate adrenaline synth-bass groove
   */
  public toggleMusic(enable?: boolean): boolean {
    this.resume();
    if (enable !== undefined) {
      this.isMusicPlaying = !enable; // will invert in next line
    }
    
    if (this.isMusicPlaying) {
      if (this.musicInterval) {
        window.clearInterval(this.musicInterval);
        this.musicInterval = null;
      }
      this.isMusicPlaying = false;
      return false;
    } else {
      this.isMusicPlaying = true;
      this.startMusicLoop();
      return true;
    }
  }

  private startMusicLoop() {
    if (!this.ctx || !this.musicGain) return;
    const bassNotes = [55, 55, 65.4, 73.4, 55, 82.4, 73.4, 49]; // A1, C2, D2, E2, G1
    const bpm = 125;
    const stepTime = (60 / bpm) / 4; // 16th notes

    this.musicStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;

      // Kick on 0, 4, 8, 12
      if (this.musicStep % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.09);
        kickGain.gain.setValueAtTime(0.7, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // Snare on 4, 12
      if (this.musicStep % 8 === 4) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, now);
        snareGain.gain.setValueAtTime(0.4, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.1);
      }

      // Bass note every 2 steps
      if (this.musicStep % 2 === 0) {
        const noteIdx = Math.floor(this.musicStep / 2) % bassNotes.length;
        const noteFreq = bassNotes[noteIdx];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(noteFreq, now);

        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.8);

        // Lowpass filter for warm grit
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + stepTime * 2);
      }

      this.musicStep = (this.musicStep + 1) % 16;
    }, stepTime * 1000);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }
}

export const soundEngine = new SoundEngine();
