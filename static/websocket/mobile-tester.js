// static/websocket/mobile-tester.js
class MobileTester {
  constructor() {
    this.testConfig = null;
    this.currentDevice = null;
    this.testResults = {};
    this.isRunning = false;
    this.performanceMetrics = {
      fps: [],
      memoryUsage: [],
      frameTimes: [],
      touchLatency: []
    };
  }

  async loadTestConfig() {
    try {
      const response = await fetch('/config/mobile-test-config.json');
      this.testConfig = await response.json();
      console.log('Mobile test configuration loaded');
      return true;
    } catch (error) {
      console.error('Failed to load test configuration:', error);
      return false;
    }
  }

  async simulateDevice(deviceKey) {
    if (!this.testConfig) await this.loadTestConfig();

    const device = this.testConfig.testDevices[deviceKey];
    if (!device) {
      console.error(`Device ${deviceKey} not found in test config`);
      return false;
    }

    this.currentDevice = device;
    console.log(`🔧 Simulating device: ${device.name}`);

    // Simulate device characteristics
    this.simulateViewport(device.viewport);
    this.simulateHardware(device);
    this.simulateTouchSupport(device.touchSupport);

    return true;
  }

  simulateViewport(viewport) {
    // Note: In a real implementation, this would modify the viewport
    // For now, we'll just log the simulation
    console.log(`📱 Viewport: ${viewport.width}x${viewport.height} @${this.currentDevice.pixelRatio}x`);

    // Update canvas size to match device
    const gameCanvas = document.getElementById('game');
    if (gameCanvas && window.resizeCanvas) {
      // Force canvas resize
      window.resizeCanvas();
    }
  }

  simulateHardware(device) {
    // Override navigator properties for testing
    const originalHardwareConcurrency = navigator.hardwareConcurrency;
    const originalUserAgent = navigator.userAgent;

    // Mock hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: device.hardwareConcurrency,
      configurable: true
    });

    console.log(`🔧 Hardware: ${device.hardwareConcurrency} cores`);
    console.log(`📊 Memory: Simulating low-end device constraints`);

    // Restore after test
    setTimeout(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: originalHardwareConcurrency,
        configurable: true
      });
    }, 1000);
  }

  simulateTouchSupport(hasTouch) {
    if (hasTouch) {
      console.log('👆 Touch support: Enabled (simulating touch device)');
      // Force touch overlay to show
      const touchOverlay = document.getElementById('touch-overlay');
      if (touchOverlay) {
        touchOverlay.style.display = 'block';
      }
    } else {
      console.log('🖱️  Touch support: Disabled (desktop mode)');
    }
  }

  async runPerformanceTest(duration = 5000) {
    console.log(`⏱️  Running performance test for ${duration}ms...`);

    this.performanceMetrics = {
      fps: [],
      memoryUsage: [],
      frameTimes: [],
      touchLatency: []
    };

    const startTime = performance.now();
    let frameCount = 0;
    let lastFrameTime = startTime;

    const measurePerformance = (timestamp) => {
      frameCount++;
      const frameTime = timestamp - lastFrameTime;
      lastFrameTime = timestamp;

      // Record metrics
      this.performanceMetrics.frameTimes.push(frameTime);

      if (performance.memory) {
        this.performanceMetrics.memoryUsage.push(
          performance.memory.usedJSHeapSize / 1048576 // Convert to MB
        );
      }

      // Calculate FPS every second
      if (timestamp - startTime >= 1000 && frameCount % 60 === 0) {
        const fps = Math.round((frameCount * 1000) / (timestamp - startTime));
        this.performanceMetrics.fps.push(fps);
      }

      if (timestamp - startTime < duration) {
        requestAnimationFrame(measurePerformance);
      } else {
        this.analyzePerformanceResults();
      }
    };

    requestAnimationFrame(measurePerformance);
  }

  analyzePerformanceResults() {
    const metrics = this.performanceMetrics;
    const targets = this.testConfig.performanceTargets;

    console.log('📊 Performance Test Results:');
    console.log('===========================');

    // FPS Analysis
    if (metrics.fps.length > 0) {
      const avgFps = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length;
      const minFps = Math.min(...metrics.fps);
      console.log(`🎯 FPS: ${avgFps.toFixed(1)} avg, ${minFps} min (target: ${targets.targetFps})`);

      if (avgFps >= targets.targetFps) {
        console.log('✅ FPS target met');
      } else {
        console.log('⚠️  FPS below target - consider optimizations');
      }
    }

    // Frame Time Analysis
    if (metrics.frameTimes.length > 0) {
      const avgFrameTime = metrics.frameTimes.reduce((a, b) => a + b, 0) / metrics.frameTimes.length;
      const maxFrameTime = Math.max(...metrics.frameTimes);
      console.log(`⏱️  Frame Time: ${avgFrameTime.toFixed(1)}ms avg, ${maxFrameTime.toFixed(1)}ms max (target: <${targets.maxFrameTime}ms)`);

      if (avgFrameTime <= targets.maxFrameTime) {
        console.log('✅ Frame time target met');
      } else {
        console.log('⚠️  Frame time above target - optimize rendering');
      }
    }

    // Memory Analysis
    if (metrics.memoryUsage.length > 0) {
      const avgMemory = metrics.memoryUsage.reduce((a, b) => a + b, 0) / metrics.memoryUsage.length;
      const maxMemory = Math.max(...metrics.memoryUsage);
      console.log(`💾 Memory: ${avgMemory.toFixed(1)}MB avg, ${maxMemory.toFixed(1)}MB max (target: <${targets.maxMemoryMB}MB)`);

      if (avgMemory <= targets.maxMemoryMB) {
        console.log('✅ Memory target met');
      } else {
        console.log('⚠️  Memory usage high - check for leaks');
      }
    }
  }

  async runTouchTest() {
    console.log('👆 Running touch control tests...');

    const touchOverlay = document.getElementById('touch-overlay');
    if (!touchOverlay || touchOverlay.style.display === 'none') {
      console.log('⚠️  Touch overlay not visible - simulating touch device first');
      await this.simulateDevice('iphone-se');
    }

    // Test virtual joysticks
    await this.testVirtualJoystick('move-stick', 'Movement Joystick');
    await this.testVirtualJoystick('look-stick', 'Camera Joystick');

    // Test action buttons
    await this.testActionButton('attack-btn', 'Attack Button');
    await this.testActionButton('interact-btn', 'Interact Button');
  }

  async testVirtualJoystick(joystickId, name) {
    const joystick = document.getElementById(joystickId);
    if (!joystick) {
      console.log(`❌ ${name}: Element not found`);
      return;
    }

    console.log(`🕹️  Testing ${name}...`);

    // Simulate touch events
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Test center position (should be neutral)
    this.simulateTouch(joystick, centerX, centerY, 100);

    // Test edge positions
    const radius = rect.width / 2 * 0.8;
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const testX = centerX + Math.cos(rad) * radius;
      const testY = centerY + Math.sin(rad) * radius;
      this.simulateTouch(joystick, testX, testY, 200);
    }

    console.log(`✅ ${name}: Touch simulation completed`);
  }

  async testActionButton(buttonId, name) {
    const button = document.getElementById(buttonId);
    if (!button) {
      console.log(`❌ ${name}: Element not found`);
      return;
    }

    console.log(`🔘 Testing ${name}...`);

    // Simulate button press
    this.simulateTouch(button, button.offsetLeft + button.offsetWidth / 2,
                              button.offsetTop + button.offsetHeight / 2, 500);

    console.log(`✅ ${name}: Button test completed`);
  }

  simulateTouch(element, clientX, clientY, duration) {
    const touch = new Touch({
      identifier: Date.now(),
      target: element,
      clientX: clientX,
      clientY: clientY,
      pageX: clientX,
      pageY: clientY,
      screenX: clientX,
      screenY: clientY
    });

    const touchList = new TouchList([touch]);

    // Touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: touchList,
      targetTouches: touchList,
      changedTouches: touchList,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(touchStartEvent);

    // Touch end after duration
    setTimeout(() => {
      const touchEndEvent = new TouchEvent('touchend', {
        touches: new TouchList(),
        targetTouches: new TouchList(),
        changedTouches: touchList,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(touchEndEvent);
    }, duration);
  }

  async runAudioTest() {
    console.log('🎵 Testing audio system...');

    if (!window.audioManager) {
      console.log('❌ Audio manager not found');
      return;
    }

    const audioStatus = window.audioLoader ? window.audioLoader.getStatus() : window.audioManager.getState();
    console.log('🎵 Audio Status:', audioStatus);

    // Test audio loading
    if (window.audioLoader && !audioStatus.audioLoaded) {
      console.log('📥 Loading audio tracks...');
      await window.audioLoader.loadAudioTracks();
    }

    // Test mood changes
    const moods = ['calm', 'omen', 'panic', 'triumph'];
    for (const mood of moods) {
      console.log(`🎵 Testing mood: ${mood}`);
      window.audioManager.setMood(mood);
      await this.delay(2000); // Wait 2 seconds
    }

    console.log('✅ Audio test completed');
  }

  async runOracleTest() {
    console.log('🔮 Testing Oracle integration...');

    if (!window.oracleClient) {
      console.log('❌ Oracle client not found');
      return;
    }

    // Test WebSocket connection
    if (window.wsManager) {
      console.log('🔌 WebSocket Status:', {
        connected: window.wsManager.isConnected,
        sessionId: window.wsManager.sessionId
      });
    }

    // Test behavior updates
    console.log('📊 Sending test behavior data...');
    window.oracleClient.updateBehaviorMetrics();

    // Test visual preference
    console.log('🎨 Sending test visual preference...');
    window.oracleClient.sendVisualPreference(240); // Blue tint

    // Test game state
    console.log('🎮 Sending test game state...');
    window.oracleClient.sendGameState('playing', 1, 45.2);

    console.log('✅ Oracle test completed');
  }

  async runFullTestSuite(deviceKey = 'iphone-se') {
    console.log('🚀 Starting full mobile test suite...');
    console.log('=====================================');

    this.isRunning = true;

    try {
      // Setup device simulation
      await this.simulateDevice(deviceKey);

      // Wait for game to initialize
      await this.delay(1000);

      // Run all tests
      await this.runPerformanceTest(3000);
      await this.delay(500);

      await this.runTouchTest();
      await this.delay(500);

      await this.runAudioTest();
      await this.delay(500);

      await this.runOracleTest();

      console.log('🎉 Test suite completed successfully!');

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Debug helpers
  getTestResults() {
    return {
      currentDevice: this.currentDevice,
      performanceMetrics: this.performanceMetrics,
      isRunning: this.isRunning,
      testConfig: this.testConfig
    };
  }
}

// Global instance
const mobileTester = new MobileTester();
window.mobileTester = mobileTester;

// Add to window for easy access
window.runMobileTests = () => mobileTester.runFullTestSuite();
window.testDevice = (device) => mobileTester.simulateDevice(device);
window.testPerformance = () => mobileTester.runPerformanceTest();
window.testTouch = () => mobileTester.runTouchTest();
window.testAudio = () => mobileTester.runAudioTest();
window.testOracle = () => mobileTester.runOracleTest();