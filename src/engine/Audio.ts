// A fully procedural audio engine built on the Web Audio API. Every sound —
// sword swings, hit impacts, chest chimes, ambient music beds — is
// synthesized at runtime from oscillators and noise, so the game needs no
// external audio assets and carries no licensing risk.

type ToneType = OscillatorType;

interface ToneOptions {
  type?: ToneType;
  gain?: number;
  attack?: number;
  release?: number;
  sweepTo?: number;
  detune?: number;
  dest?: GainNode;
}

interface NoiseOptions {
  gain?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  dest?: GainNode;
}

interface DroneHandle {
  stop: (fadeSec: number) => void;
}

const BIOME_ROOTS: Record<string, number> = {
  hub: 220,
  ember: 196,
  tide: 174.6,
  gale: 233,
  finale: 164.8,
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicVolume = 0.45;
  private sfxVolume = 0.8;
  private muted = false;
  private currentDrone: DroneHandle | null = null;
  private currentMusicKey: string | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Call from any early user gesture (menu click) — browsers block audio
   * until one happens, so this just warms up the context ahead of time. */
  unlock(): void {
    this.ensure();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.musicVolume, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.05);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyVolumes();
  }
  isMuted(): boolean {
    return this.muted;
  }
  setMusicVolume(v: number): void {
    this.musicVolume = v;
    this.applyVolumes();
  }
  setSfxVolume(v: number): void {
    this.sfxVolume = v;
    this.applyVolumes();
  }
  getMusicVolume(): number {
    return this.musicVolume;
  }
  getSfxVolume(): number {
    return this.sfxVolume;
  }

  // --- low-level synthesis -------------------------------------------------

  private tone(freq: number, duration: number, opts: ToneOptions = {}): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (opts.detune) osc.detune.setValueAtTime(opts.detune, ctx.currentTime);
    if (opts.sweepTo) osc.frequency.linearRampToValueAtTime(opts.sweepTo, ctx.currentTime + duration);
    const gain = ctx.createGain();
    const peak = opts.gain ?? 0.2;
    const attack = opts.attack ?? 0.005;
    const release = opts.release ?? duration;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + attack + release);
    osc.connect(gain);
    gain.connect(opts.dest ?? this.sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + attack + release + 0.05);
  }

  private noise(duration: number, opts: NoiseOptions = {}): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? 'bandpass';
    filter.frequency.value = opts.filterFreq ?? 1200;
    const gain = ctx.createGain();
    const peak = opts.gain ?? 0.2;
    gain.gain.setValueAtTime(peak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(opts.dest ?? this.sfxGain);
    src.start();
    src.stop(ctx.currentTime + duration + 0.05);
  }

  // --- sound effects --------------------------------------------------------

  sfxSwingMelee(): void {
    this.tone(320, 0.12, { type: 'triangle', sweepTo: 180, gain: 0.18, release: 0.1 });
    this.noise(0.06, { gain: 0.08, filterFreq: 2200 });
  }

  sfxSwingRanged(): void {
    this.tone(700, 0.14, { type: 'sine', sweepTo: 1200, gain: 0.14, release: 0.12 });
  }

  sfxHitEnemy(): void {
    this.tone(160, 0.09, { type: 'square', sweepTo: 60, gain: 0.16, release: 0.08 });
    this.noise(0.05, { gain: 0.12, filterFreq: 900, filterType: 'lowpass' });
  }

  sfxHitPlayer(): void {
    this.tone(140, 0.15, { type: 'sawtooth', sweepTo: 50, gain: 0.2, release: 0.14 });
    this.noise(0.08, { gain: 0.15, filterFreq: 500, filterType: 'lowpass' });
  }

  sfxDeathEnemy(): void {
    this.tone(300, 0.3, { type: 'sawtooth', sweepTo: 40, gain: 0.18, release: 0.28 });
  }

  sfxDeathBoss(): void {
    this.tone(220, 1.1, { type: 'sawtooth', sweepTo: 30, gain: 0.28, release: 1.0 });
    this.noise(0.6, { gain: 0.2, filterFreq: 300, filterType: 'lowpass' });
  }

  sfxPickupGlimmer(): void {
    this.tone(880, 0.1, { type: 'sine', sweepTo: 1300, gain: 0.16, release: 0.12 });
  }

  sfxPickupShard(): void {
    this.tone(660, 0.1, { type: 'sine', sweepTo: 1100, gain: 0.15, release: 0.1 });
    this.tone(990, 0.14, { type: 'sine', sweepTo: 1500, gain: 0.12, release: 0.18, attack: 0.05 });
  }

  sfxAbility(): void {
    this.tone(220, 0.22, { type: 'sawtooth', sweepTo: 440, gain: 0.16, release: 0.2 });
    this.noise(0.15, { gain: 0.1, filterFreq: 1800 });
  }

  sfxGateOpen(): void {
    this.tone(140, 0.4, { type: 'triangle', sweepTo: 260, gain: 0.16, release: 0.38 });
  }

  sfxSwitchPress(): void {
    this.tone(500, 0.08, { type: 'square', gain: 0.12, release: 0.07 });
  }

  sfxBarrierClear(): void {
    this.tone(400, 0.3, { type: 'sine', sweepTo: 800, gain: 0.16, release: 0.28 });
    this.noise(0.2, { gain: 0.1, filterFreq: 2500 });
  }

  sfxLevelUp(): void {
    [523, 659, 784, 1046].forEach((f, i) => {
      const ctx = this.ensure();
      if (!ctx) return;
      window.setTimeout(() => this.tone(f, 0.2, { type: 'triangle', gain: 0.16, release: 0.18 }), i * 70);
    });
  }

  sfxVictory(): void {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.35, { type: 'sine', gain: 0.18, release: 0.32 }), i * 110);
    });
  }

  sfxDefeat(): void {
    this.tone(220, 0.9, { type: 'sawtooth', sweepTo: 90, gain: 0.18, release: 0.85 });
  }

  sfxClick(): void {
    this.tone(440, 0.05, { type: 'square', gain: 0.1, release: 0.045 });
  }

  // --- music -----------------------------------------------------------------

  private makeDrone(root: number, intense: boolean): DroneHandle {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return { stop: () => {} };
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.musicGain);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = intense ? 1400 : 800;
    filter.connect(bus);

    const ratios = [1, 1.5, 2, intense ? 2.99 : 3];
    const oscillators: OscillatorNode[] = [];
    for (const ratio of ratios) {
      const osc = ctx.createOscillator();
      osc.type = ratio === 1 ? 'sine' : 'triangle';
      osc.frequency.value = root * ratio;
      osc.detune.value = (Math.random() - 0.5) * 6;
      const g = ctx.createGain();
      g.gain.value = ratio === 1 ? 0.5 : 0.5 / (ratios.indexOf(ratio) + 1);
      osc.connect(g);
      g.connect(filter);
      osc.start();
      oscillators.push(osc);
    }

    // slow filter LFO so the pad feels alive rather than static
    const lfo = ctx.createOscillator();
    lfo.frequency.value = intense ? 0.35 : 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = intense ? 300 : 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    oscillators.push(lfo);

    let pulseId: number | null = null;
    if (intense) {
      const pulse = () => {
        this.tone(root / 2, 0.25, { type: 'sine', gain: 0.14, release: 0.22, dest: bus });
        pulseId = window.setTimeout(pulse, 700);
      };
      pulseId = window.setTimeout(pulse, 700);
    }

    return {
      stop: (fadeSec: number) => {
        if (pulseId) window.clearTimeout(pulseId);
        const stopTime = ctx.currentTime + fadeSec;
        bus.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3);
        for (const osc of oscillators) {
          try {
            osc.stop(stopTime + 0.2);
          } catch {
            // already stopped
          }
        }
      },
    };
  }

  startMusic(key: string): void {
    if (!this.ensure()) return;
    if (this.currentMusicKey === key) return;
    this.stopMusic(0.8);
    this.currentMusicKey = key;
    const root = BIOME_ROOTS[key] ?? 220;
    this.currentDrone = this.makeDrone(root, key === 'boss' || key === 'finale-boss');
  }

  startBossMusic(): void {
    this.startMusic('boss');
  }

  stopMusic(fadeSec = 0.6): void {
    if (this.currentDrone) {
      this.currentDrone.stop(fadeSec);
      this.currentDrone = null;
    }
    this.currentMusicKey = null;
  }
}

export const audio = new AudioEngine();
