# Mobile Testing & Audio Integration Guide

## 🎯 Testing on Target Mobile Devices

### Automated Testing Framework
The project now includes a comprehensive mobile testing framework that simulates various devices and tests all implemented features.

### Running Tests

1. **Open Test Runner**: Navigate to `test-mobile.html` in your browser
2. **Select Device**: Choose from iPhone SE, Pixel 4a, iPad Mini, or Galaxy A52
3. **Run Tests**: Execute individual tests or the full test suite

### Test Coverage
- ✅ **Performance**: FPS, frame times, memory usage
- ✅ **Touch Controls**: Virtual joysticks and action buttons
- ✅ **Audio System**: Loading, playback, mood changes
- ✅ **Oracle Integration**: WebSocket communication
- ✅ **Visual Effects**: Sky shadows, color tinting

## 🎵 Audio Integration

### Download CC0 Audio Files

Run the provided download script:
```bash
chmod +x download-audio.sh
./download-audio.sh
```

Or download manually from recommended sources:

#### 1. Calm Drone (Background Atmosphere)
- **Source**: Freesound.org - Search "dark ambient drone"
- **Example**: "Dark Ambient Drone" by klankbeeld (CC0)
- **Save as**: `static/assets/audio/ambient/calm-drone.mp3`
- **Specs**: 2-3 minutes, low-frequency drones

#### 2. Tension Build (Monster Proximity)
- **Source**: OpenGameArt.org - Audio section
- **Example**: "Tension Ambient" packs (CC0)
- **Save as**: `static/assets/audio/ambient/tension-build.mp3`
- **Specs**: 1-2 minutes, rising harmonics

#### 3. Danger Pulse (High Danger)
- **Source**: Zapsplat.com - Free horror section
- **Example**: "Horror Ambient Pulse" (CC0)
- **Save as**: `static/assets/audio/ambient/danger-pulse.mp3`
- **Specs**: 30-60 seconds, pulsing rhythms

#### 4. Victory Chorus (Success)
- **Source**: Freesound.org - Search "triumphant choir"
- **Example**: "Victory Fanfare" by user (CC0)
- **Save as**: `static/assets/audio/ambient/victory-chorus.mp3`
- **Specs**: 5-15 seconds, resolution tones

### Audio Configuration
Edit `static/config/audio-config.json` to update file paths and settings.

### Testing Audio
1. Open the game in a browser
2. Click anywhere to unlock audio (mobile requirement)
3. Use the test runner to verify audio loading and mood changes
4. Check browser console for audio status messages

## 📱 Manual Device Testing

### Physical Device Testing
1. **Deploy to HTTPS**: Mobile browsers require secure context for audio
2. **Test on Real Devices**: Use browser dev tools remote debugging
3. **Check Performance**: Monitor FPS and memory usage
4. **Verify Touch**: Test virtual joysticks and buttons

### Browser Dev Tools
- **Console**: Check for audio loading messages
- **Network**: Verify audio files load correctly
- **Performance**: Monitor frame rates and memory
- **Application**: Check WebSocket connections

## 🔧 Troubleshooting

### Audio Issues
- **No Sound**: Check browser audio permissions
- **Mobile Silent**: Ensure user interaction before audio
- **Loading Failed**: Verify file paths and CORS headers

### Touch Issues
- **Controls Not Showing**: Check touch device detection
- **Unresponsive**: Verify event listeners are attached
- **Performance**: Check for touch event throttling

### Performance Issues
- **Low FPS**: Enable mobile optimizations
- **High Memory**: Check for audio/context leaks
- **Slow Loading**: Optimize asset sizes

## 📊 Performance Benchmarks

### Target Metrics
- **FPS**: 30+ on mobile devices
- **Memory**: <50MB total usage
- **Load Time**: <3 seconds initial load
- **Touch Latency**: <100ms response

### Device-Specific Targets
- **iPhone SE**: 30 FPS, <40MB memory
- **Pixel 4a**: 45 FPS, <45MB memory
- **iPad Mini**: 50 FPS, <35MB memory

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Download and integrate CC0 audio files
- [ ] Test on target devices using test runner
- [ ] Verify WebSocket connections work
- [ ] Check performance meets targets
- [ ] Test touch controls responsiveness

### Production Setup
- [ ] Enable HTTPS for audio compatibility
- [ ] Configure CORS for WebSocket connections
- [ ] Set up monitoring for performance metrics
- [ ] Prepare fallback for audio loading failures

### Post-Deployment
- [ ] Monitor real user performance data
- [ ] Collect feedback on mobile experience
- [ ] Update audio tracks based on user response
- [ ] Optimize based on real-world usage patterns

## 🎯 Success Criteria

### Mobile Experience
- ✅ Touch controls work smoothly on all target devices
- ✅ Audio loads and plays correctly on mobile
- ✅ Performance meets or exceeds targets
- ✅ Oracle integration functions properly

### Audio Integration
- ✅ All mood tracks load without errors
- ✅ Crossfading works smoothly
- ✅ Mobile audio unlock functions
- ✅ No copyright infringement risks

### Overall System
- ✅ WebSocket communication stable
- ✅ Visual effects performant
- ✅ Color tinting responsive
- ✅ Sky shadows subtle and atmospheric

The implementation is now ready for real-world mobile testing and audio integration!