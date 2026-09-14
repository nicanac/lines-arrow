import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticService {
  private static enabled = true;

  public static setEnabled(val: boolean): void {
    this.enabled = val;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  public static async success(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }

  public static async bump(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 20, 40]);
      }
    }
  }

  public static async levelClear(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 40, 60, 40, 100]);
      }
    }
  }
}
