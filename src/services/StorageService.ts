import { Preferences } from '@capacitor/preferences';

export class StorageService {
  private static readonly KEY_LEVEL = 'lines_arrow_current_level';
  private static readonly KEY_SCORE = 'lines_arrow_high_score';
  private static readonly KEY_SOUND = 'lines_arrow_sound_enabled';
  private static readonly KEY_HAPTIC = 'lines_arrow_haptic_enabled';
  private static readonly KEY_HINTS = 'lines_arrow_hints_count';

  public static async getLevel(): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_LEVEL });
      return value ? parseInt(value, 10) : 1;
    } catch {
      const val = localStorage.getItem(this.KEY_LEVEL);
      return val ? parseInt(val, 10) : 1;
    }
  }

  public static async setLevel(level: number): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY_LEVEL, value: level.toString() });
    } catch {
      localStorage.setItem(this.KEY_LEVEL, level.toString());
    }
  }

  public static async getSoundEnabled(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_SOUND });
      return value !== null ? value === 'true' : true;
    } catch {
      const val = localStorage.getItem(this.KEY_SOUND);
      return val !== null ? val === 'true' : true;
    }
  }

  public static async setSoundEnabled(enabled: boolean): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY_SOUND, value: enabled.toString() });
    } catch {
      localStorage.setItem(this.KEY_SOUND, enabled.toString());
    }
  }

  public static async getHints(): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: this.KEY_HINTS });
      return value ? parseInt(value, 10) : 3;
    } catch {
      const val = localStorage.getItem(this.KEY_HINTS);
      return val ? parseInt(val, 10) : 3;
    }
  }

  public static async setHints(count: number): Promise<void> {
    try {
      await Preferences.set({ key: this.KEY_HINTS, value: count.toString() });
    } catch {
      localStorage.setItem(this.KEY_HINTS, count.toString());
    }
  }
}
