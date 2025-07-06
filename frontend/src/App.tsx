import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './stores/themeStore'
import { useWebSocketStore } from './stores/webSocketStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PlaygroundPage from './pages/PlaygroundPage'
import ChatPage from './pages/ChatPage'
import PricingPage from './pages/PricingPage'
import DocsPage from './pages/DocsPage'
import { cn } from './lib/utils'

function App() {
  const { theme } = useThemeStore()
  const { connect } = useWebSocketStore()

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    // Connect to WebSocket on app start
    connect()
  }, [connect])

  return (
    <div className={cn("min-h-screen bg-background text-foreground", theme)}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App