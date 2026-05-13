/**
 * Simple Haptic Service using Navigator Vibrate API
 */

class HapticService {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  vibrate(pattern: number | number[]) {
    if (!this.enabled || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Haptics not supported or blocked');
    }
  }

  light() {
    this.vibrate(10);
  }

  medium() {
    this.vibrate(20);
  }

  heavy() {
    this.vibrate(30);
  }

  success() {
    this.vibrate([10, 50, 10]);
  }

  error() {
    this.vibrate([30, 50, 30, 50, 30]);
  }
}

export const hapticService = new HapticService();
