# CC0/Public Domain Ambient Audio Sources

## Safe Audio Sources for Tartarus Atmosphere

All audio sources listed here are confirmed to be in the public domain or released under Creative Commons Zero (CC0) license, making them safe for commercial use without attribution requirements.

## Recommended Sources

### 1. Freesound.org (CC0 Licensed)
**Website**: https://freesound.org
**Search Terms**: "dark ambient", "dungeon", "horror", "atmospheric"

#### Curated CC0 Ambient Tracks:
- **Dark Ambient Drone**: Search for "dark ambient drone" - multiple CC0 options
- **Cave Echoes**: Search for "cave reverb" - natural cave recordings
- **Wind Through Ruins**: Search for "wind ruins" - atmospheric wind sounds
- **Distant Thunder**: Search for "thunder rumble" - low-frequency atmospheric

### 2. OpenGameArt.org (CC0/Public Domain)
**Website**: https://opengameart.org
**Audio Section**: https://opengameart.org/art-search?keys=&field_art_type_tid%5B%5D=13

#### Recommended Ambient Packs:
- **Dark Ambient Pack**: Multiple short loops for layering
- **Dungeon Atmosphere**: Stone/cave ambient sounds
- **Mystical Ambient**: Ethereal, otherworldly tones

### 3. Zapsplat.com (Free with Attribution, but CC0 options available)
**Website**: https://www.zapsplat.com
**Free Section**: https://www.zapsplat.com/sound-effect-packs/

#### CC0/Free Options:
- **Horror Ambient**: Search for "horror ambient"
- **Dark Fantasy**: Medieval dungeon atmospheres
- **Wind & Weather**: Natural atmospheric sounds

## Integration Strategy

### Audio Engine Setup

```javascript
// static/websocket/audio-manager.js
class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterVolume = 0.4;
    this.tracks = {};
    this.currentMood = 'calm';
  }

  async loadTrack(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.tracks[name] = audioBuffer;
  }

  async playTrack(name, loop = true) {
    if (!this.tracks[name]) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.tracks[name];
    source.loop = loop;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
    return { source, gainNode };
  }

  setMood(mood) {
    this.currentMood = mood;
    // Crossfade between mood tracks
    this.crossfadeToMood(mood);
  }

  async crossfadeToMood(newMood) {
    // Implementation for smooth transitions
  }
}
```

### File Organization

```
static/assets/audio/
├── ambient/
│   ├── calm-drone.mp3      # Base calm atmosphere
│   ├── tension-build.mp3   # Rising tension
│   ├── danger-pulse.mp3    # High danger state
│   └── victory-chorus.mp3  # Success moments
├── sfx/
│   ├── footsteps-stone.mp3
│   ├── door-creak.mp3
│   ├── monster-growl.mp3
│   └── item-collect.mp3
└── procedural/             # Generated audio (future)
    ├── noise-grains.mp3
    └── reverb-impulses.wav
```

### Mobile Audio Considerations

```javascript
// Mobile audio unlock (required for iOS)
async function unlockAudio() {
  if (this.audioContext.state === 'suspended') {
    await this.audioContext.resume();
  }
}

// Call on first user interaction
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });
```

## Specific Track Recommendations

### Calm Exploration (Loop)
- **Source**: Freesound - "Dark Ambient Drone" by user "klankbeeld"
- **Duration**: 2-3 minutes
- **Characteristics**: Low-frequency drones, subtle reverb
- **Use**: Default background during safe exploration

### Tension Building (Loop)
- **Source**: OpenGameArt - "Tension Ambient" packs
- **Duration**: 1-2 minutes
- **Characteristics**: Rising harmonics, increasing intensity
- **Use**: When monster awareness > 0.3

### High Danger (Loop)
- **Source**: Zapsplat - "Horror Ambient" free packs
- **Duration**: 30-60 seconds
- **Characteristics**: Pulsing rhythms, dissonant tones
- **Use**: When monster is chasing or health is low

### Victory/Defeat (One-shot)
- **Source**: Freesound - "Triumphant Choir" or "Defeat Drone"
- **Duration**: 5-15 seconds
- **Characteristics**: Resolution or despair tones
- **Use**: Game state changes

## Procedural Audio Generation (Future Enhancement)

For truly unique atmospheres, consider generating audio procedurally:

```javascript
// Basic noise generator for atmospheric textures
function generateNoise(duration, frequency) {
  const sampleRate = 44100;
  const numSamples = duration * sampleRate;
  const buffer = new AudioBuffer({
    length: numSamples,
    sampleRate: sampleRate
  });

  // Fill with noise algorithm
  // ...implementation...
}
```

## Performance Optimization

### Audio Compression
- **Format**: MP3 at 128kbps for balance of quality/size
- **Length**: Keep ambient tracks under 3MB each
- **Loading**: Load audio after game initialization

### Memory Management
- **Limit**: Keep no more than 3 tracks loaded simultaneously
- **Cleanup**: Dispose of AudioBuffer objects when switching moods
- **Pooling**: Reuse AudioBufferSourceNode objects

## Legal Compliance

All audio assets must be:
- ✅ Public Domain
- ✅ CC0 Licensed
- ✅ Explicitly free for commercial use
- ✅ No attribution required

**Avoid**: Any copyrighted game/movie soundtracks, even if "inspired by" Dante or similar works.