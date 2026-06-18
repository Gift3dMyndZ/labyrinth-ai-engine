from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
import logging
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["websocket"])

# Oracle connection manager
class OracleManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.oracle_state = {
            "mood": "calm",
            "awareness": 0.0,
            "difficulty_modifier": 1.0,
            "last_update": datetime.now().isoformat()
        }

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logging.info(f"Oracle connected: {session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logging.info(f"Oracle disconnected: {session_id}")

    async def send_oracle_state(self, session_id: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json({
                "type": "oracle_state",
                **self.oracle_state
            })

    async def broadcast_visual_command(self, effect: str, intensity: float):
        message = {
            "type": "visual_state",
            "effect": effect,
            "intensity": intensity,
            "timestamp": datetime.now().timestamp()
        }
        for connection in self.active_connections.values():
            await connection.send_json(message)

    async def broadcast_audio_command(self, mood: str, intensity: float = 0.5):
        message = {
            "type": "audio_state",
            "mood": mood,
            "intensity": intensity,
            "timestamp": datetime.now().timestamp()
        }
        for connection in self.active_connections.values():
            await connection.send_json(message)

oracle_manager = OracleManager()

@router.websocket("/oracle/{session_id}")
async def oracle_websocket(websocket: WebSocket, session_id: str):
    await oracle_manager.connect(websocket, session_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            # Process player behavior signals
            await process_player_message(session_id, data)

            # Send oracle response if needed
            await oracle_manager.send_oracle_state(session_id)

    except WebSocketDisconnect:
        oracle_manager.disconnect(session_id)
    except Exception as e:
        logging.error(f"WebSocket error for {session_id}: {e}")
        oracle_manager.disconnect(session_id)

async def process_player_message(session_id: str, data: dict):
    """Process incoming player messages and update oracle state"""

    message_type = data.get("type")

    if message_type == "player_visual_preference":
        # Track color preferences for oracle adaptation
        hue = data.get("hue", 0)
        # Oracle might respond with environmental changes
        if hue > 300 or hue < 60:  # Cool colors
            await oracle_manager.broadcast_visual_command("fog", 0.7)
        elif hue > 60 and hue < 180:  # Warm colors
            await oracle_manager.broadcast_visual_command("embers", 0.5)

    elif message_type == "player_behavior":
        # Update oracle awareness based on player behavior
        fear_level = data.get("fear_level", 0)
        curiosity_level = data.get("curiosity_level", 0)

        # Adjust oracle mood based on player state
        if fear_level > 0.7:
            oracle_manager.oracle_state["mood"] = "hungry"
            oracle_manager.oracle_state["awareness"] = min(1.0, oracle_manager.oracle_state["awareness"] + 0.1)
            await oracle_manager.broadcast_audio_command("omen", fear_level)
            await oracle_manager.broadcast_visual_command("shadows", fear_level)
        elif curiosity_level > 0.8:
            oracle_manager.oracle_state["mood"] = "curious"
            await oracle_manager.broadcast_audio_command("calm", 0.3)
        else:
            oracle_manager.oracle_state["mood"] = "calm"
            oracle_manager.oracle_state["awareness"] = max(0.0, oracle_manager.oracle_state["awareness"] - 0.02)

    elif message_type == "player_touch_pattern":
        # Mobile-specific behavior analysis
        pattern = data.get("pattern")
        if pattern == "double_tap":
            # Player might be anxious
            oracle_manager.oracle_state["awareness"] += 0.05

    elif message_type == "game_state":
        # React to game state changes
        state = data.get("state")
        if state == "dead":
            oracle_manager.oracle_state["mood"] = "triumph"
            await oracle_manager.broadcast_audio_command("triumph", 1.0)
        elif state == "escaped":
            oracle_manager.oracle_state["mood"] = "enraged"
            await oracle_manager.broadcast_audio_command("panic", 1.0)

    # Update timestamp
    oracle_manager.oracle_state["last_update"] = datetime.now().isoformat()

# Utility functions for external access
async def trigger_oracle_event(event_type: str, **kwargs):
    """Trigger oracle events from other parts of the application"""
    if event_type == "monster_proximity":
        distance = kwargs.get("distance", 1.0)
        intensity = max(0, 1.0 - distance)  # Closer = higher intensity
        await oracle_manager.broadcast_audio_command("omen", intensity)
        await oracle_manager.broadcast_visual_command("shadows", intensity)

    elif event_type == "player_health_low":
        await oracle_manager.broadcast_audio_command("panic", 0.8)
        await oracle_manager.broadcast_visual_command("tendrils", 0.6)

async def get_oracle_state(session_id: str = None):
    """Get current oracle state"""
    return oracle_manager.oracle_state