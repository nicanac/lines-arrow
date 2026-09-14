import { Howl } from 'howler';
import { GameConfig } from '../config/game.config';

export class AudioManager {
  private static instance: AudioManager;
  private soundEnabled = true;
  private musicEnabled = true;
  private audioCtx: AudioContext | null = null;
  private sounds: Map<string, Howl> = new Map();

  private constructor() {
    // Lazy AudioContext initialization on first user gesture
    const unlockAudio = () => {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  /**
   * Sound effect for tapping an arrow
   */
  public playTap(): void {
    if (!this.soundEnabled) return;
    this.synthesizeTone(520, 0.05, 'sine', 0.15);
  }

  /**
   * Sound effect for successful arrow escape (whoosh / pleasant chime)
   */
  public playEscape(pitchModifier = 1): void {
    if (!this.soundEnabled) return;
    const baseFreq = 440 * pitchModifier;
    this.synthesizeChime([baseFreq, baseFreq * 1.25, baseFreq * 1.5], 0.12, 0.25);
  }

  /**
   * Sound effect when arrow bumps an obstacle
   */
  public playBump(): void {
    if (!this.soundEnabled) return;
    this.synthesizeTone(140, 0.12, 'sawtooth', 0.25, 60);
  }

  /**
   * Sound effect for level completion
   */
  public playLevelClear(): void {
    if (!this.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.synthesizeTone(freq, 0.2, 'triangle', 0.3);
      }, idx * 80);
    });
  }

  /**
   * Sound effect for game over
   */
  public playGameOver(): void {
    if (!this.soundEnabled) return;
    const notes = [440, 415.3, 392, 349.2];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.synthesizeTone(freq, 0.25, 'sawtooth', 0.2);
      }, idx * 110);
    });
  }

  /**
   * Sound effect for hint trigger
   */
  public playHint(): void {
    if (!this.soundEnabled) return;
    this.synthesizeTone(880, 0.15, 'sine', 0.2);
    setTimeout(() => {
      this.synthesizeTone(1174.66, 0.2, 'sine', 0.2);
    }, 100);
  }

  private synthesizeTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    vol = 0.2,
    rampToFreq?: number
  ): void {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      if (rampToFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(10, rampToFreq),
          this.audioCtx.currentTime + duration
        );
      }

      gain.gain.setValueAtTime(vol * GameConfig.audio.sfxVolume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }

  private synthesizeChime(freqs: number[], spacing: number, duration: number): void {
    freqs.forEach((f, i) => {
      setTimeout(() => {
        this.synthesizeTone(f, duration, 'sine', 0.2);
      }, i * spacing * 1000);
    });
  }
}
