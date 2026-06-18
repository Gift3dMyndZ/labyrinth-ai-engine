// static/websocket/audio-manager.js
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.4;
    this.tracks = new Map();
    this.currentMood = 'calm';
    this.activeSources = new Map();
    this.isInitialized = false;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context (handle different browser implementations)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context on mobile (required for iOS)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('AudioManager initialized');
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
    }
  }

  async unlockAudio() {
    // Mobile browsers require user interaction to unlock audio
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context unlocked');
      } catch (error) {
        console.error('Failed to unlock audio context:', error);
      }
    }
  }

  async loadTrack(name, url) {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.tracks.set(name, audioBuffer);
      console.log(`Loaded audio track: ${name}`);
    } catch (error) {
      console.error(`Failed to load audio track ${name}:`, error);
    }
  }

  async playTrack(name, loop = true, fadeInTime = 2.0) {
    if (!this.isInitialized) await this.initialize();
    if (!this.tracks.has(name)) {
      console.warn(`Audio track not found: ${name}`);
      return null;
    }

    try {
      const buffer = this.tracks.get(name);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;

      // Create gain node for volume control and fading
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0; // Start silent

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Fade in
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume, now + fadeInTime);

      source.start();
      this.activeSources.set(name, { source, gainNode });

      // Clean up when track ends (if not looping)
      if (!loop) {
        source.onended = () => {
          this.activeSources.delete(name);
        };
      }

      return { source, gainNode };
    } catch (error) {
      console.error(`Failed to play audio track ${name}:`, error);
      return null;
    }
  }

  async stopTrack(name, fadeOutTime = 1.0) {
    if (!this.activeSources.has(name)) return;

    const { source, gainNode } = this.activeSources.get(name);

    try {
      // Fade out
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);

      // Stop after fade
      setTimeout(() => {
        try {
          source.stop();
        } catch (error) {
          // Source might already be stopped
        }
        this.activeSources.delete(name);
      }, fadeOutTime * 1000);
    } catch (error) {
      console.error(`Failed to stop audio track ${name}:`, error);
    }
  }

  async crossfadeToMood(newMood, fadeTime = 3.0) {
    if (this.currentMood === newMood) return;

    const oldMood = this.currentMood;
    this.currentMood = newMood;

    // Stop current mood tracks
    const moodTracks = this.getMoodTracks(oldMood);
    for (const track of moodTracks) {
      if (this.activeSources.has(track)) {
        this.stopTrack(track, fadeTime);
      }
    }

    // Start new mood tracks
    const newMoodTracks = this.getMoodTracks(newMood);
    for (const track of newMoodTracks) {
      setTimeout(() => {
        this.playTrack(track, true, fadeTime);
      }, 100); // Small delay to prevent audio glitches
    }
  }

  getMoodTracks(mood) {
    // Define which tracks play for each mood
    const moodMapping = {
      'calm': ['calm-drone'],
      'omen': ['tension-build'],
      'panic': ['danger-pulse'],
      'triumph': ['victory-chorus']
    };

    return moodMapping[mood] || [];
  }

  setMood(mood, intensity = 0.5) {
    // Adjust volume based on intensity
    this.masterVolume = 0.2 + (intensity * 0.6); // 0.2 to 0.8 range

    // Update active tracks volume
    for (const [name, { gainNode }] of this.activeSources) {
      const now = this.audioContext.currentTime;
      gainNode.gain.setTargetAtTime(this.masterVolume, now, 0.1);
    }

    // Crossfade to new mood
    this.crossfadeToMood(mood);
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update all active tracks
    for (const [name, { gainNode }] of this.activeSources) {
      const now = this.audioContext.currentTime;
      gainNode.gain.setTargetAtTime(this.masterVolume, now, 0.1);
    }
  }

  cleanup() {
    // Stop all tracks
    for (const [name] of this.activeSources) {
      this.stopTrack(name, 0.1);
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.activeSources.clear();
    this.tracks.clear();
    this.isInitialized = false;
  }

  // Get current audio state for debugging
  getState() {
    return {
      initialized: this.isInitialized,
      contextState: this.audioContext?.state,
      masterVolume: this.masterVolume,
      currentMood: this.currentMood,
      activeTracks: Array.from(this.activeSources.keys()),
      loadedTracks: Array.from(this.tracks.keys()),
      isMobile: this.isMobile
    };
  }
}

// Global instance
const audioManager = new AudioManager();
window.audioManager = audioManager;