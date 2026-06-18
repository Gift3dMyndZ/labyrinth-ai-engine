// static/websocket/connection.js
class WebSocketManager {
  constructor() {
    this.socket = null;
    this.sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.messageQueue = [];
    this.eventListeners = {};
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/oracle/${this.sessionId}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = (event) => {
        console.log('Oracle WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }

        this.emit('connected', event);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('Oracle WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected', event);

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  send(data) {
    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      // Queue message for later
      this.messageQueue.push(data);
    }
  }

  handleMessage(data) {
    const messageType = data.type;

    // Emit typed events
    this.emit(messageType, data);

    // Handle specific message types
    switch (messageType) {
      case 'oracle_state':
        this.handleOracleState(data);
        break;
      case 'audio_state':
        this.handleAudioState(data);
        break;
      case 'visual_state':
        this.handleVisualState(data);
        break;
      default:
        console.log('Unhandled message type:', messageType, data);
    }
  }

  handleOracleState(data) {
    // Update local oracle awareness
    console.log('Oracle state update:', data);
    // Could trigger UI updates or game state changes
  }

  handleAudioState(data) {
    // Trigger audio manager mood changes
    if (window.audioManager) {
      window.audioManager.setMood(data.mood, data.intensity);
    }
    // Also notify oracle client if available
    if (window.oracleClient && window.oracleClient.handleAudioState) {
      window.oracleClient.handleAudioState(data);
    }  }

  handleVisualState(data) {
    // Trigger visual effects
    if (window.visualEffects) {
      window.visualEffects.triggerEffect(data.effect, data.intensity, data.position);
    }
  }

  // Event system for components to listen to WebSocket events
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }
}

// Global instance
const wsManager = new WebSocketManager();
window.wsManager = wsManager;