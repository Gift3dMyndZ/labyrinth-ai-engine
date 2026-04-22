// static/websocket/oracle-client.js
class OracleClient {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.lastBehaviorUpdate = 0;
    this.behaviorUpdateInterval = 5000; // Send behavior updates every 5 seconds
    this.playerBehavior = {
      fear_level: 0,
      curiosity_level: 0,
      aggression_level: 0,
      backtracking_ratio: 0,
      exploration_efficiency: 0
    };
  }

  initialize() {
    // Connect to WebSocket
    this.wsManager.connect();

    // Set up event listeners
    this.wsManager.on('oracle_state', (data) => {
      this.handleOracleState(data);
    });

    // Start behavior monitoring
    this.startBehaviorMonitoring();
  }

  sendVisualPreference(hue, saturation = null, brightness = null) {
    const message = {
      type: "player_visual_preference",
      hue: hue,
      timestamp: Date.now()
    };

    if (saturation !== null) message.saturation = saturation;
    if (brightness !== null) message.brightness = brightness;

    this.wsManager.send(message);
  }

  sendTouchPattern(pattern, duration = 0, intensity = 0.5) {
    this.wsManager.send({
      type: "player_touch_pattern",
      pattern: pattern,
      duration: duration,
      intensity: intensity,
      timestamp: Date.now()
    });
  }

  sendGameState(state, floor = 1, survivalTime = 0, monsterDistance = null) {
    const message = {
      type: "game_state",
      state: state,
      floor: floor,
      survival_time: survivalTime,
      timestamp: Date.now()
    };

    if (monsterDistance !== null) {
      message.monster_distance = monsterDistance;
    }

    this.wsManager.send(message);
  }

  updateBehaviorMetrics() {
    const now = Date.now();
    if (now - this.lastBehaviorUpdate < this.behaviorUpdateInterval) return;

    this.lastBehaviorUpdate = now;

    // Calculate behavior metrics from game state
    this.calculateBehaviorMetrics();

    this.wsManager.send({
      type: "player_behavior",
      ...this.playerBehavior,
      timestamp: now
    });
  }

  calculateBehaviorMetrics() {
    // Fear level based on erratic movement and proximity to monster
    const monsterDistance = this.getMonsterDistance();
    const movementErraticness = this.getMovementErraticness();

    this.playerBehavior.fear_level = Math.min(1.0,
      (1.0 - monsterDistance) * 0.7 + movementErraticness * 0.3
    );

    // Curiosity based on exploration patterns
    this.playerBehavior.curiosity_level = this.getExplorationCuriosity();

    // Aggression based on attack frequency (when implemented)
    this.playerBehavior.aggression_level = 0; // Placeholder

    // Backtracking ratio
    this.playerBehavior.backtracking_ratio = this.getBacktrackingRatio();

    // Exploration efficiency
    this.playerBehavior.exploration_efficiency = this.getExplorationEfficiency();
  }

  getMonsterDistance() {
    // Calculate normalized distance to monster (0 = very close, 1 = far)
    if (typeof monster === 'undefined' || !monster) return 1.0;

    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize to 0-1 scale (closer = lower value)
    return Math.max(0, Math.min(1, distance / 20)); // 20 units = "far"
  }

  getMovementErraticness() {
    // Measure how erratic player movement is (potential fear indicator)
    // This would track recent movement patterns
    return 0; // Placeholder - would need movement history
  }

  getExplorationCuriosity() {
    // Based on how thoroughly player explores
    if (typeof tele === 'undefined' || !tele.cellsVisited) return 0;

    const totalCells = CFG.GRID * CFG.GRID;
    const visitedCells = tele.cellsVisited.size;
    const explorationRatio = visitedCells / totalCells;

    // Curiosity increases with thorough exploration
    return Math.min(1.0, explorationRatio * 2);
  }

  getBacktrackingRatio() {
    // Measure how often player revisits areas (stress indicator)
    // Would need path tracking
    return 0; // Placeholder
  }

  getExplorationEfficiency() {
    // Ratio of new cells discovered vs distance traveled
    return 0.5; // Placeholder
  }

  handleOracleState(data) {
    // React to oracle state changes
    console.log('Oracle mood:', data.mood, 'Awareness:', data.awareness);

    // Could trigger game difficulty adjustments
    if (data.difficulty_modifier !== 1.0) {
      // Adjust monster speed or other parameters
      if (typeof monster !== 'undefined' && monster) {
        monster.difficultyMod = data.difficulty_modifier;
      }
    }
  }

  // Integration with audio system
  handleAudioState(data) {
    if (window.audioManager) {
      window.audioManager.setMood(data.mood, data.intensity || 0.5);
    }
  }

  startBehaviorMonitoring() {
    // Send periodic behavior updates
    setInterval(() => {
      this.updateBehaviorMetrics();
    }, this.behaviorUpdateInterval);
  }
}

// Initialize when game starts
function initOracleClient() {
  if (window.wsManager) {
    window.oracleClient = new OracleClient(window.wsManager);
    window.oracleClient.initialize();
  }
}

// Auto-initialize after WebSocket manager loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOracleClient);
} else {
  initOracleClient();
}