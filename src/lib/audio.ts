/**
 * Simple Audio Service using Web Audio API to generate UI sounds
 */

class AudioService {
  private context: AudioContext | null = null;
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.1, 0.05);
  }

  playSuccess() {
    this.init();
    if (!this.context) return;
    this.playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 100);
  }

  playError() {
    this.playTone(150, 'square', 0.3, 0.1);
  }

  playPop() {
    this.playTone(400, 'sine', 0.05, 0.1);
  }
}

export const audioService = new AudioService();
