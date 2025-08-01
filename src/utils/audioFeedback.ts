// Audio feedback system for idea management
export class AudioFeedback {
  private static instance: AudioFeedback;
  private audioContext: AudioContext | null = null;

  static getInstance(): AudioFeedback {
    if (!AudioFeedback.instance) {
      AudioFeedback.instance = new AudioFeedback();
    }
    return AudioFeedback.instance;
  }

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  private async playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): Promise<void> {
    try {
      const audioContext = await this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      return new Promise(resolve => {
        oscillator.onended = () => resolve();
      });
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  }

  async playMainIdeaSaved(): Promise<void> {
    // Gentle success tone - main idea
    await this.playTone(800, 0.2, 'sine', 0.4);
  }

  async playSubComponentSaved(): Promise<void> {
    // Softer tick sound - sub-component
    await this.playTone(600, 0.1, 'square', 0.25);
  }

  async playFollowUpSaved(): Promise<void> {
    // Brief higher tone - follow-up idea
    await this.playTone(1000, 0.15, 'triangle', 0.3);
  }

  async playClarificationNeeded(): Promise<void> {
    // Distinctive question chime
    await this.playTone(650, 0.15, 'sine', 0.35);
    await new Promise(resolve => setTimeout(resolve, 50));
    await this.playTone(850, 0.15, 'sine', 0.35);
  }

  async playIdeasLinked(): Promise<void> {
    // Connection sound - ascending tones
    await this.playTone(500, 0.1, 'sine', 0.3);
    await new Promise(resolve => setTimeout(resolve, 30));
    await this.playTone(700, 0.1, 'sine', 0.3);
    await new Promise(resolve => setTimeout(resolve, 30));
    await this.playTone(900, 0.1, 'sine', 0.3);
  }

  async playMultipleIdeasSequence(ideas: Array<{ idea_type: string }>): Promise<void> {
    for (const [index, idea] of ideas.entries()) {
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      switch (idea.idea_type) {
        case 'main':
          await this.playMainIdeaSaved();
          break;
        case 'sub-component':
          await this.playSubComponentSaved();
          break;
        case 'follow-up':
          await this.playFollowUpSaved();
          break;
        default:
          await this.playMainIdeaSaved();
      }
    }
  }
}

export const audioFeedback = AudioFeedback.getInstance();