import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary')
      return res.data
    },
    enabled: !!session
  })
  
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/' },
    { icon: 'view_kanban', label: 'Tracking Board', path: '/tracking', badge: summary?.activeOpportunitiesCount },
    { icon: 'assignment', label: 'All Applications', path: '/applications', badge: summary?.totalApplications },
    { icon: 'calendar_today', label: 'Calendar', path: '/calendar', badge: summary?.interviewsCount > 0 ? summary?.interviewsCount : null },
    { icon: 'insights', label: 'Analytics', path: '/analytics' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ]

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  const handleAddClick = () => {
    navigate('/tracking', { state: { openAddModal: true } })
    onToggle() // Close sidebar on mobile after navigation
  }

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a nav item
    if (window.innerWidth < 1024) {
      onToggle()
    }
  }

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside className={`
        h-screen w-64 fixed left-0 top-0 
        bg-surface-container-low/70 backdrop-blur-3xl 
        shadow-xl shadow-surface-container-highest/10 
        flex flex-col py-8 px-4 z-50 
        border-r border-outline-variant/10 
        transition-all duration-300 ease-in-out
        
        /* Desktop: always visible */
        lg:translate-x-0
        
        /* Mobile: slide in/out */
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button - mobile only */}
        <button 
          onClick={onToggle}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center border border-outline-variant/20 overflow-hidden shadow-inner">
            <img src="/logo.png" alt="CA Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter text-on-surface">Career Architect</span>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-primary-dim">Premium Suite</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 group relative ${
                isActive(item.path)
                  ? 'text-primary font-bold border-r-2 border-primary bg-primary/5'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="font-body tracking-wider text-sm uppercase font-semibold flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge !== null && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive(item.path) ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant/10">
          <button 
            onClick={handleAddClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-primary to-primary-container rounded-xl text-on-primary-container font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add New Application</span>
          </button>
          
          <div className="mt-8 flex items-center gap-3 px-2 overflow-hidden">
            {session?.user?.image ? (
              <img
                alt="User Executive Profile"
                className="w-10 h-10 rounded-full border border-outline-variant/30 object-cover shrink-0"
                src={session.user.image}
              />
            ) : (
               <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
               </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-on-surface truncate">{session?.user?.name || 'Professional'}</span>
              <span className="text-[10px] text-on-surface-variant truncate font-bold uppercase tracking-widest">{(session?.user as any)?.title || 'Executive'}</span>
            </div>
            <span 
              className="material-symbols-outlined text-on-surface-variant ml-auto text-lg cursor-pointer hover:text-error transition-colors"
              onClick={handleLogout}
            >
              logout
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
