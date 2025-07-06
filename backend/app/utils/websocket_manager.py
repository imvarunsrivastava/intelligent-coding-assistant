"""
WebSocket Manager for real-time communication
"""
from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manager for WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """Send a message to a specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to {client_id}: {str(e)}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients"""
        disconnected_clients = []
        
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to broadcast to {client_id}: {str(e)}")
                disconnected_clients.append(client_id)
        
        # Remove disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    def get_active_connections(self) -> List[str]:
        """Get list of active client IDs"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)
