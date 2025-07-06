import { create } from 'zustand'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

interface WebSocketStore {
  socket: WebSocket | null
  isConnected: boolean
  messages: WebSocketMessage[]
  connect: () => void
  disconnect: () => void
  sendMessage: (message: any) => void
  addMessage: (message: WebSocketMessage) => void
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  messages: [],

  connect: () => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/frontend-${Date.now()}`
    
    try {
      const socket = new WebSocket(wsUrl)
      
      socket.onopen = () => {
        console.log('WebSocket connected')
        set({ socket, isConnected: true })
      }
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const message: WebSocketMessage = {
            type: data.type || 'message',
            data: data,
            timestamp: new Date()
          }
          get().addMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      socket.onclose = () => {
        console.log('WebSocket disconnected')
        set({ socket: null, isConnected: false })
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!get().isConnected) {
            get().connect()
          }
        }, 3000)
      }
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null, isConnected: false })
    }
  },

  sendMessage: (message) => {
    const { socket, isConnected } = get()
    if (socket && isConnected) {
      try {
        socket.send(JSON.stringify(message))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages.slice(-99), message] // Keep last 100 messages
    }))
  },
}))