import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const Register = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

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

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/"
      })

      if (authError) {
        setError(authError.message || 'Registration failed')
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
      setError(`Failed to sign up with ${provider}. Please try again.`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-body selection:bg-primary/30">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/40 dark:bg-[#0b0e14]/70 backdrop-blur-[40px] flex justify-between items-center px-8 h-16 border-b border-outline-variant/10 dark:border-white/5 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-on-surface block">Career Architect</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-lg bg-surface-container-high/50 hover:bg-surface-container-highest dark:bg-white/5 dark:hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all active:scale-90"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined text-lg">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <Link 
            to="/login" 
            className="text-on-surface-variant uppercase tracking-[0.05em] text-[10px] font-bold hover:text-primary transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-6 bg-atmospheric relative overflow-hidden">
        {/* Atmospheric Ambient Light */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]"></div>

        {/* Registration Card Container */}
        <div className="w-full max-w-lg relative z-10">
          <div className="glass-card rounded-xl p-10 underglow-primary">
            {/* Header Section */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface font-headline mb-2">Build Your Future</h1>
              <p className="text-on-surface-variant text-sm">Join the elite network of executive professionals.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-bold text-center">
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-bold ml-1">Full Name</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium" 
                    placeholder="Alex Sterling" 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-bold ml-1">Email Address</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium" 
                    placeholder="alex@executive.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Create Password */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-bold ml-1">Create Password</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium" 
                    placeholder="••••••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.05em] text-on-surface-variant font-bold ml-1">Confirm Password</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-lg py-4 px-5 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium" 
                    placeholder="••••••••••••" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* CTA Button */}
              <button 
                className={`w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-bold rounded-lg shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:opacity-70'} transition-all duration-300 uppercase tracking-widest text-xs mt-4`} 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/15"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-transparent px-4 text-on-surface-variant font-medium">Or continue with</span>
              </div>
            </div>

            {/* Social Sign-up */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => handleSocialSignIn('google')}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors border border-outline-variant/10 group disabled:opacity-50"
              >
                <img 
                  alt="Google" 
                  className="w-5 h-5" 
                  src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
                />
                <span className="text-[12px] font-semibold text-on-surface">Google</span>
              </button>
              <button 
                onClick={() => handleSocialSignIn('linkedin')}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors border border-outline-variant/10 group disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
                <span className="text-[12px] font-semibold text-on-surface">LinkedIn</span>
              </button>
            </div>

            {/* Footer Link */}
            <div className="text-center">
              <Link to="/login" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors duration-300">
                Already have an account? <span className="text-primary font-semibold underline decoration-primary/30 underline-offset-4">Sign In</span>
              </Link>
            </div>
          </div>

          {/* Supporting Brand Visual */}
          <div className="mt-8 flex justify-center items-center gap-12 opacity-40 text-on-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Elite Network</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b0e14] border-t border-[#45484f]/15 w-full py-12 px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <div className="text-sm font-bold text-[#ecedf6]">Career Architect</div>
          <div className="text-[#a9abb3] font-['Inter'] text-[10px] uppercase tracking-wider font-bold opacity-60">
            Career Architect v1.0.0 | © {new Date().getFullYear()} Zarazir Corp
          </div>
          <div className="flex gap-6">
            <a className="text-[#a9abb3] hover:text-[#ecedf6] transition-colors font-['Inter'] text-[12px]" href="#">Privacy Policy</a>
            <a className="text-[#a9abb3] hover:text-[#ecedf6] transition-colors font-['Inter'] text-[12px]" href="#">Terms of Service</a>
            <a className="text-[#a9abb3] hover:text-[#ecedf6] transition-colors font-['Inter'] text-[12px]" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Register
