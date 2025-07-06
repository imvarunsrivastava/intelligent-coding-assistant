import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Code2, 
  MessageSquare, 
  PlayCircle, 
  DollarSign, 
  BookOpen, 
  Moon, 
  Sun, 
  Menu,
  X,
  Github,
  Twitter,
  Zap
} from 'lucide-react'
import { Button } from './ui/Button'
import { useThemeStore } from '../stores/themeStore'
import { useWebSocketStore } from '../stores/webSocketStore'
import { useState } from 'react'
import { cn } from '../lib/utils'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const { theme, toggleTheme } = useThemeStore()
  const { isConnected } = useWebSocketStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/', icon: Code2 },
    { name: 'Playground', href: '/playground', icon: PlayCircle },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
    { name: 'Docs', href: '/docs', icon: BookOpen },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="hidden font-bold sm:inline-block gradient-text">
              AI Assistant
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                    isActive(item.href) 
                      ? "text-foreground" 
                      : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <div 
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* GitHub Link */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9"
            >
              <a 
                href="https://github.com/your-repo" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>

            {/* Get Started Button */}
            <Button variant="gradient" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/playground">
                <Zap className="mr-2 h-4 w-4" />
                Get Started
              </Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container py-4">
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                <div className="pt-3 border-t">
                  <Button variant="gradient" size="sm" asChild className="w-full">
                    <Link to="/playground" onClick={() => setMobileMenuOpen(false)}>
                      <Zap className="mr-2 h-4 w-4" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-8 md:py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-purple-600">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold gradient-text">AI Assistant</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered coding assistant that helps you write, understand, and improve code.
              </p>
              <div className="flex space-x-3">
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://twitter.com/your-handle" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/playground" className="hover:text-foreground">Playground</Link></li>
                <li><Link to="/chat" className="hover:text-foreground">AI Chat</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><a href="#" className="hover:text-foreground">VS Code Extension</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><a href="#" className="hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground">Examples</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Intelligent Coding Assistant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout