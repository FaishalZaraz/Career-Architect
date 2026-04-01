import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const Login = () => {
  const navigate = useNavigate()
  const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePos({ x: `${x}%`, y: `${y}%` })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/"
      })

      if (authError) {
        setError(authError.message || 'Authentication failed')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'linkedin') => {
    setIsLoading(true)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin
      })
    } catch (err) {
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-on-surface font-body selection:bg-primary/30 selection:text-primary">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-background/40 dark:bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-8 w-full border-b border-outline-variant/10 dark:border-white/5 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden border border-outline-variant/10">
            <img src="/logo.png" alt="CA Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-on-surface block">Career Architect</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-highest dark:bg-white/5 dark:hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all active:scale-90"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined text-lg">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main 
        className="relative w-full h-screen flex items-center justify-center atmospheric-underglow px-4"
        style={{ '--x': mousePos.x, '--y': mousePos.y } as React.CSSProperties}
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]"></div>
        </div>

        {/* Login Card */}
        <div className="glass-card w-full max-w-[440px] p-10 rounded-xl shadow-2xl relative z-10">
          <header className="mb-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center mb-6 border border-outline-variant/20 overflow-hidden shadow-inner">
              <img src="/logo.png" alt="CA Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Welcome Back</h1>
            <p className="text-on-surface-variant text-sm font-medium">Continue your career evolution.</p>
          </header>

          {error && (
            <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-wider uppercase text-on-surface-variant px-1" htmlFor="email">Email Address</label>
              <div className="relative group input-glow rounded-lg">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </div>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary/20 transition-all font-medium" 
                  id="email" 
                  placeholder="architect@executive.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="block text-xs font-bold tracking-wider uppercase text-on-surface-variant" htmlFor="password">Password</label>
              </div>
              <div className="relative group input-glow rounded-lg">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary/20 transition-all font-medium" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button 
              className={`w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold py-4 rounded-lg shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-primary/20 active:scale-[0.98]'} transition-all text-sm tracking-wide uppercase`} 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <span className="bg-surface-container px-4 text-xs font-bold text-outline-variant relative z-10 uppercase tracking-widest">OR CONNECT WITH</span>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/20 -translate-y-1/2"></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialSignIn('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-bright py-3 rounded-lg border border-outline-variant/10 transition-colors active:scale-95 group disabled:opacity-50"
            >
              <img 
                alt="Google Logo" 
                className="w-5 h-5" 
                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
              />
              <span className="text-xs font-bold text-on-surface">GOOGLE</span>
            </button>
            <button 
              onClick={() => handleSocialSignIn('linkedin')}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-bright py-3 rounded-lg border border-outline-variant/10 transition-colors active:scale-95 group disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
              </svg>
              <span className="text-xs font-bold text-on-surface">LINKEDIN</span>
            </button>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant font-medium">
              New to the architecture? 
              <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" to="/register">Create an Account</Link>
            </p>
          </footer>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full py-6 flex flex-col md:flex-row items-center justify-between px-12 gap-4 bg-transparent border-t border-white/5">
        <div className="text-[10px] tracking-wider uppercase text-slate-500 font-bold opacity-60">
          Career Architect v1.0.0 | © {new Date().getFullYear()} Zarazir Corp
        </div>
        <div className="flex gap-8">
          <a className="text-xs tracking-wider uppercase text-slate-500 hover:text-slate-200 transition-all active:scale-95" href="#">Privacy Policy</a>
          <a className="text-xs tracking-wider uppercase text-slate-500 hover:text-slate-200 transition-all active:scale-95" href="#">Terms of Service</a>
          <a className="text-xs tracking-wider uppercase text-slate-500 hover:text-slate-200 transition-all active:scale-95" href="#">Security</a>
          <a className="text-xs tracking-wider uppercase text-slate-500 hover:text-slate-200 transition-all active:scale-95" href="#">Support</a>
        </div>
      </footer>
    </div>
  )
}

export default Login
