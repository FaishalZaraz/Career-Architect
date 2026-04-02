import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import TrackingBoard from './pages/TrackingBoard'
import AllApplications from './pages/AllApplications'
import Calendar from './pages/Calendar'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import { CalendarProvider } from './context/CalendarContext'
import { authClient } from './lib/auth-client'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarProvider>
        <Router>
          <AppContent />
        </Router>
      </CalendarProvider>
    </QueryClientProvider>
  )
}

function AppContent() {
  const location = useLocation()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)
  const { data: session, isPending } = authClient.useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(prev => !prev)

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center mb-8 border border-outline-variant/20 overflow-hidden shadow-2xl relative z-10 animate-fade-in animate-scale-in">
          <img src="/logo.png" alt="CA Logo" className="w-full h-full object-cover" />
        </div>
        <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden mb-6 relative z-10">
          <div className="w-full h-full bg-primary animate-loading-bar origin-left"></div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant animate-pulse relative z-10">Initializing Career Architect</p>
        
        {/* Background Decorative Glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!session && !isAuthPage) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <main className="lg:ml-64 min-h-screen bg-surface flex flex-col w-full relative transition-all duration-300">
        <TopBar onMenuToggle={toggleSidebar} />
        
        {/* Main Content Area */}
        <div className="mt-16 p-4 md:p-6 lg:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracking" element={<TrackingBoard />} />
            <Route path="/applications" element={<AllApplications />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            {/* Fallback for other routes */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
          
          {/* Footer */}
          <footer className="mt-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold opacity-40">
            <span>Career Architect v1.0.0</span>
            <div className="flex gap-4 md:gap-6">
              <span className="hover:text-primary cursor-pointer transition-colors">Documentation</span>
              <span className="hover:text-primary cursor-pointer transition-colors">© {new Date().getFullYear()} Zarazir Corp</span>
            </div>
          </footer>
        </div>
        
        {/* Visual Polish: Ambient Glows */}
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0 hidden md:block"></div>
        <div className="fixed bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0 hidden md:block"></div>
      </main>
    </div>
  )
}

export default App
