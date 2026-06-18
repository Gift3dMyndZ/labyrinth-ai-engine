// static/websocket/audio-loader.js
class AudioLoader {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.config = null;
    this.isLoaded = false;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  async loadConfig() {
    try {
      const response = await fetch('/config/audio-config.json');
      this.config = await response.json();
      console.log('Audio configuration loaded');
      return true;
    } catch (error) {
      console.error('Failed to load audio configuration:', error);
      return false;
    }
  }

  async initializeAudio() {
    if (!this.config) {
      const success = await this.loadConfig();
      if (!success) return false;
    }

    try {
      await this.audioManager.initialize();

      // Set initial volume
      this.audioManager.setMasterVolume(this.config.audioSettings.masterVolume);

      // Apply mobile optimizations
      if (this.isMobile) {
        this.applyMobileOptimizations();
      }

      // Unlock audio on first user interaction
      this.setupAudioUnlock();

      console.log('Audio system initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      return false;
    }
  }

  async loadAudioTracks() {
    if (!this.config) return false;

    const tracksToLoad = this.isMobile && !this.config.audioSettings.preloadOnMobile
      ? this.getEssentialTracks()
      : Object.keys(this.config.audioTracks);

    console.log(`Loading ${tracksToLoad.length} audio tracks...`);

    const loadPromises = tracksToLoad.map(trackName => {
      const trackConfig = this.config.audioTracks[trackName];
      if (trackConfig) {
        return this.audioManager.loadTrack(trackName, trackConfig.url);
      }
    });

    try {
      await Promise.all(loadPromises);
      this.isLoaded = true;
      console.log('All audio tracks loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load some audio tracks:', error);
      // Continue with partially loaded audio
      this.isLoaded = true;
      return true;
    }
  }

  getEssentialTracks() {
    // Only load calm and tension tracks on mobile to save bandwidth
    return ['calm-drone', 'tension-build'];
  }

  applyMobileOptimizations() {
    // Reduce volume slightly on mobile
    this.audioManager.setMasterVolume(this.config.audioSettings.masterVolume * 0.8);

    // Use shorter fade times
    if (this.config.mobileOptimizations.shorterFades) {
      // This would modify the audio manager's fade times
      console.log('Applied mobile audio optimizations');
    }
  }

  setupAudioUnlock() {
    const unlockAudio = async () => {
      await this.audioManager.unlockAudio();

      // Start with calm background music
      if (this.isLoaded) {
        this.audioManager.setMood('calm');
      }
    };

    // Unlock on various user interactions
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true });
    });
  }

  async startBackgroundMusic() {
    if (!this.isLoaded) {
      await this.loadAudioTracks();
    }

    // Start with calm mood
    this.audioManager.setMood('calm');
  }

  // Integration with Oracle WebSocket messages
  handleAudioState(message) {
    if (message.type === 'audio_state') {
      this.audioManager.setMood(message.mood, message.intensity || 0.5);
    }
  }

  // Debug information
  getStatus() {
    return {
      configLoaded: !!this.config,
      audioLoaded: this.isLoaded,
      audioManagerState: this.audioManager.getState(),
      isMobile: this.isMobile
    };
  }
}

// Global instance
const audioLoader = new AudioLoader(window.audioManager);
window.audioLoader = audioLoader;

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
  const success = await audioLoader.initializeAudio();
  if (success) {
    console.log('Audio system ready');
  }
});