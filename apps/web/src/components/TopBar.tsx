import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { authClient } from '../lib/auth-client'
import { useCalendar } from '../context/CalendarContext'

interface TopBarProps {
  onMenuToggle: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isCalendar = location.pathname === '/calendar'
  const { currentDate, next, prev } = useCalendar()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const { data: session } = authClient.useSession()
  const user = session?.user

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const { data: allJobs } = useQuery({
    queryKey: ['all-jobs-search'],
    queryFn: async () => {
      const res = await api.get('/jobs')
      return res.data
    },
    enabled: searchTerm.length > 0
  })

  const filteredJobs = searchTerm.length > 0 && allJobs
    ? allJobs.filter((job: any) => 
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.role.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : []

  useEffect(() => {
    if (searchTerm === '') {
      setShowResults(false)
    } else {
      setShowResults(true)
    }
  }, [searchTerm])

  const formattedDate = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-40 bg-surface-container-high/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 border-b border-outline-variant/10 transition-all duration-300">
      {/* Left section: Hamburger + Search */}
      <div className="flex items-center flex-1 max-w-xl gap-3">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {/* Mobile Logo - Only show on small screens */}
        <div className="lg:hidden flex items-center gap-2 shrink-0 mr-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center border border-outline-variant/20 overflow-hidden">
            <img src="/logo.png" alt="CA Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className={`relative w-full group ${mobileSearchOpen ? 'absolute inset-0 z-50 bg-surface-container-high flex items-center px-4 gap-2' : 'hidden sm:block'}`}>
          {mobileSearchOpen && (
            <button 
              onClick={() => {
                setMobileSearchOpen(false)
                setSearchTerm('')
              }}
              className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors sm:hidden"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
            <input
              id="mobile-search-input"
              className="w-full bg-surface-container-lowest border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline text-on-surface focus:bg-surface-bright/50"
              placeholder={isCalendar ? "Search applications, dates..." : "Quick search company or role..."}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm && setShowResults(true)}
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-surface-container-high border border-outline-variant/20 rounded-2xl shadow-2xl z-[60] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Results</span>
                <button onClick={() => setShowResults(false)} className="material-symbols-outlined text-sm text-on-surface-variant hover:text-on-surface transition-colors">close</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job: any) => (
                    <div 
                      key={job.id} 
                      onClick={() => {
                        navigate('/applications')
                        setSearchTerm('')
                        setShowResults(false)
                      }}
                      className="p-4 hover:bg-on-surface/5 cursor-pointer border-b border-outline-variant/5 last:border-none flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 border border-outline-variant/10 group-hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-xl text-primary">{job.status === 'Offer' ? 'military_tech' : job.status === 'Interview' ? 'rocket_launch' : 'work'}</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h5 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{job.role}</h5>
                        <p className="text-xs text-on-surface-variant truncate">{job.company}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${job.status === 'Offer' ? 'bg-tertiary/10 text-tertiary' : job.status === 'Interview' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {job.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-on-surface-variant italic">No results found for "{searchTerm}"</p>
                  </div>
                )}
              </div>
              {filteredJobs.length > 0 && (
                <div 
                  onClick={() => {
                    navigate('/applications')
                    setSearchTerm('')
                    setShowResults(false)
                  }}
                  className="p-3 bg-surface-container-highest/30 text-center cursor-pointer hover:bg-surface-container-highest transition-colors"
                >
                  <span className="text-xs font-bold text-primary">View All Applications</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Button */}
        <button 
          className="sm:hidden p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
          onClick={() => {
            setMobileSearchOpen(true)
            setTimeout(() => {
              const el = document.getElementById('mobile-search-input')
              if (el) el.focus()
            }, 100)
          }}
        >
          <span className="material-symbols-outlined text-xl">search</span>
        </button>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        {isCalendar && (
          <div className="hidden md:flex items-center gap-3 pr-4 border-r border-outline-variant/20">
            <span className="text-sm font-medium text-on-surface font-body">{formattedDate}</span>
            <div className="flex bg-surface-container rounded-lg p-1">
              <button 
                onClick={prev}
                className="p-1 hover:bg-surface-bright rounded text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button 
                onClick={next}
                className="p-1 hover:bg-surface-bright rounded text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}

        <div className="h-8 w-[1px] bg-outline-variant/20 hidden md:block"></div>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all active:scale-90"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="material-symbols-outlined text-xl">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <div className="hidden md:flex items-center gap-3 px-2">
          {location.pathname === '/analytics' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-on-surface">Analytics Dashboard</span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_month</span>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-xs font-bold text-on-surface">{user?.name || 'Alexander Vance'}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">{(user as any)?.title || 'Executive'}</p>
            </div>
          )}
          <img
            alt="User Executive Profile"
            className="w-8 h-8 rounded-full border border-primary/20 object-cover"
            src={user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCoC_dZ_zDxgwg8bc1RwyvZIdrKN85kPJ5rALLia3Pi6vQrkQhI0-Tjd0V9y67lcwEWz845ANnNWegWXz2jHciJYQRQ2G4_PY9F6tnmo_ZW-G4ePEmaAz4JUMsDmjJthapg_W1d0-hkocHtGbYRX4GtXKwcg15phEYZvN42E3Og6l10e84oPECB97HD8_bN8VC5uOSPR9wGPsK0jJwV1QFq8H62o7i6vNIdm_GArIClSYcMVUeS_yVTqw-veos6RL1tjflzA66VYTg"}
          />
        </div>
      </div>
    </header>
  )
}

export default TopBar
