import React from 'react'
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

const queryClient = new QueryClient()

import { CalendarProvider } from './context/CalendarContext'

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

import { authClient } from './lib/auth-client'

function AppContent() {
  const location = useLocation()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant animate-pulse">Initializing Career Architect...</p>
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
      <Sidebar />
      
      <main className="ml-64 min-h-screen bg-surface flex flex-col w-full relative">
        <TopBar />
        
        {/* Main Content Area */}
        <div className="mt-16 p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
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
          <footer className="mt-auto pt-8 flex items-center justify-between text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold opacity-40">
            <span>Career Architect v1.0.0</span>
            <div className="flex gap-6">
              <span className="hover:text-primary cursor-pointer transition-colors">Documentation</span>
              <span className="hover:text-primary cursor-pointer transition-colors">© {new Date().getFullYear()} Zarazir Corp</span>
            </div>
          </footer>
        </div>
        
        {/* Visual Polish: Ambient Glows */}
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none z-0"></div>
      </main>
    </div>
  )
}

export default App
