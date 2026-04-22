# Mobile Performance Tuning Guide

## Current Performance Analysis

Based on the implemented features, here are the key performance considerations for mobile devices.

## Frame Rate Optimization

### 1. Sky Shadows Performance
**Current Implementation**: Updates at ~10fps, but can be optimized further.

```javascript
// Optimize sky shadow updates
let lastSkyUpdate = 0;
const SKY_UPDATE_INTERVAL = 100; // ms

function updateSkyShadows() {
  const now = performance.now();
  if (now - lastSkyUpdate < SKY_UPDATE_INTERVAL) return;
  lastSkyUpdate = now;

  // Only update visible shadows
  skyShadows.forEach(shadow => {
    if (shadow.x > -shadow.size && shadow.x < canvas.width + shadow.size) {
      shadow.x += shadow.speed;
      if (shadow.x > canvas.width + shadow.size) {
        shadow.x = -shadow.size;
        shadow.y = Math.random() * canvas.height * 0.3;
      }
    }
  });
}
```

### 2. Touch Input Throttling
**Current Issue**: Touch events can fire rapidly on mobile.

```javascript
// Add touch event throttling
let lastTouchTime = 0;
const TOUCH_THROTTLE = 16; // ~60fps

function handleTouchMove(e) {
  const now = performance.now();
  if (now - lastTouchTime < TOUCH_THROTTLE) return;
  lastTouchTime = now;

  // Process touch input...
}
```

### 3. Canvas Rendering Optimization

```javascript
// Use requestAnimationFrame properly
let animationId = null;
let lastFrameTime = 0;
const TARGET_FPS = 30; // Reduce from 60fps on mobile
const FRAME_INTERVAL = 1000 / TARGET_FPS;

function gameLoop(timestamp) {
  if (timestamp - lastFrameTime < FRAME_INTERVAL) {
    animationId = requestAnimationFrame(gameLoop);
    return;
  }

  lastFrameTime = timestamp;

  // Game logic and rendering...
  updatePlayer();
  render();
  renderSky();

  animationId = requestAnimationFrame(gameLoop);
}
```

## Battery Considerations

### 1. Reduce CPU Usage

```javascript
// Detect device capabilities and adjust
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowPower = navigator.hardwareConcurrency <= 2; // Dual-core or less

if (isMobile || isLowPower) {
  // Reduce quality settings
  CFG.TARGET_FPS = 30;
  SKY_UPDATE_INTERVAL = 200; // Slower shadow updates
  MONSTER_UPDATE_RATE = 100; // Less frequent AI updates
}
```

### 2. Memory Management

```javascript
// Limit shadow count on mobile
const MAX_SHADOWS = isMobile ? 3 : 5;

// Clean up unused audio contexts
function cleanupAudio() {
  if (this.audioContext && this.audioContext.state !== 'closed') {
    this.audioContext.close();
  }
}

// Call on page unload
window.addEventListener('beforeunload', cleanupAudio);
```

### 3. Touch Event Cleanup

```javascript
// Remove touch event listeners when not needed
function disableTouchControls() {
  moveStick.removeEventListener('touchstart', handleStart);
  moveStick.removeEventListener('touchmove', handleMove);
  moveStick.removeEventListener('touchend', handleEnd);
  // ... other cleanup
}
```

## Mobile-Specific Optimizations

### 1. Viewport and Scaling

```css
/* Optimize for mobile viewports */
@media (max-width: 768px) {
  canvas {
    image-rendering: auto; /* Faster rendering on mobile */
    transform: translateZ(0); /* Force hardware acceleration */
  }

  #sky-canvas {
    will-change: transform; /* Optimize for animations */
  }
}
```

### 2. Input Latency Reduction

```javascript
// Use passive event listeners where possible
joystick.addEventListener('touchmove', handleMove, { passive: true });

// Pre-allocate touch variables
let touchStartX = 0, touchStartY = 0;
let touchCurrentX = 0, touchCurrentY = 0;
```

### 3. Asset Loading Strategy

```javascript
// Progressive asset loading for mobile
async function loadAssets() {
  // Load critical assets first
  await loadCriticalAssets();

  // Load ambient audio after game starts
  if (!isMobile) {
    await loadAmbientAudio();
  }

  // Load victory audio on demand
  loadVictoryAudio = async () => {
    if (!victoryAudioLoaded) {
      await loadTrack('victory', '/assets/audio/victory.mp3');
      victoryAudioLoaded = true;
    }
  };
}
```

## Performance Monitoring

### 1. FPS Counter (Development Only)

```javascript
let frameCount = 0;
let lastFpsUpdate = 0;

function updateFPS(timestamp) {
  frameCount++;
  if (timestamp - lastFpsUpdate > 1000) {
    const fps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastFpsUpdate = timestamp;
  }
}
```

### 2. Memory Usage Tracking

```javascript
// Monitor memory usage (Chrome DevTools)
if (performance.memory) {
  setInterval(() => {
    console.log(`Memory: ${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB`);
  }, 5000);
}
```

## Device-Specific Optimizations

### iOS Safari
- **Audio**: Requires user gesture to unlock
- **Touch**: Use `-webkit-touch-callout: none`
- **Rendering**: Avoid `image-rendering: pixelated`

### Android Chrome
- **GPU**: Use `transform: translateZ(0)` for acceleration
- **Memory**: More aggressive garbage collection
- **Touch**: Handle multi-touch properly

### Low-End Devices
- **Detection**: Use `navigator.hardwareConcurrency`
- **Fallbacks**: Reduce shadow count, disable ambient audio
- **Quality**: Lower resolution rendering

## Testing Strategy

### 1. Device Testing Matrix
- **iPhone SE (2020)**: Baseline performance target
- **Samsung Galaxy A-series**: Android low-end
- **iPad Mini**: Tablet performance
- **Pixel 4a**: Mid-range Android

### 2. Performance Benchmarks
```javascript
const benchmarks = {
  targetFps: 30,
  maxMemoryMB: 50,
  maxLoadTime: 3000, // ms
  maxFrameTime: 33   // ms at 30fps
};
```

### 3. Automated Testing
```javascript
// Performance regression tests
function runPerformanceTest() {
  const startTime = performance.now();

  // Simulate 1000 frames
  for (let i = 0; i < 1000; i++) {
    updatePlayer();
    render();
  }

  const endTime = performance.now();
  const avgFrameTime = (endTime - startTime) / 1000;

  return avgFrameTime <= benchmarks.maxFrameTime;
}
```

## Implementation Checklist

- [ ] Add FPS throttling for mobile devices
- [ ] Implement shadow culling for off-screen elements
- [ ] Add touch event throttling
- [ ] Optimize canvas rendering settings
- [ ] Implement progressive asset loading
- [ ] Add device capability detection
- [ ] Create performance monitoring tools
- [ ] Test on target devices
- [ ] Profile memory usage
- [ ] Optimize battery drain

## Key Metrics to Monitor

1. **Frame Time**: Keep under 33ms (30fps)
2. **Memory Usage**: Stay under 50MB
3. **Battery Impact**: Test with device battery monitoring
4. **Load Time**: Keep initial load under 3 seconds
5. **Touch Latency**: Maintain under 100ms response time