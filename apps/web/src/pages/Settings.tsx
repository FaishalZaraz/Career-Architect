import React, { useState, useEffect, useRef } from 'react'
import { authClient } from '../lib/auth-client'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const Settings = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  
  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      // Better Auth client methods return { data, error }
      const res = await authClient.listSessions()
      return res.data || []
    }
  })

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      await authClient.revokeSession({ token })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] })
      setIsTerminating(null)
    }
  })

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [isTerminating, setIsTerminating] = useState<string | null>(null) // Session ID or 'all' or 'current'
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setTitle((session.user as any).title || 'SVP of Engineering')
      setBio((session.user as any).bio || 'Strategic leader focused on architectural excellence and scaling global engineering teams.')
    }
  }, [session])

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const res = await api.post('/user/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.url) {
        await authClient.updateUser({
          image: res.data.url
        })
        queryClient.invalidateQueries({ queryKey: ['session'] })
      }
    } catch (err) {
      console.error('Photo upload failed:', err)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const { error } = await authClient.updateUser({
         name,
         // @ts-ignore - custom fields supported by Better Auth if mapped
         title,
         // @ts-ignore
         bio
      })

      if (error) {
        throw new Error(error.message)
      }

      queryClient.invalidateQueries({ queryKey: ['session'] })
      alert('Profile updated successfully.')
    } catch (err: any) {
      console.error('Profile update failed:', err)
      alert(`Update failed: ${err.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    revokeMutation.mutate(sessionId)
  }

  const handleLogout = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  if (isSessionPending) return <div className="p-20 text-center animate-pulse uppercase tracking-widest text-xs font-bold text-on-surface-variant">Accessing Cryptographic Identity...</div>

  return (
    <div className="pt-4 pb-12 max-w-5xl mx-auto space-y-12 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Header Section */}
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-on-surface mb-2">Executive Preferences</h2>
        <p className="text-on-surface-variant max-w-2xl text-lg">Manage your architectural workspace, security protocols, and integration ecosystem.</p>
      </div>

      {/* Bento Layout for Settings */}
      <div className="space-y-8">
        {/* Profile Information: Main Section */}
        <section className="space-y-8">
          {/* Profile Card */}
          <div className="bg-surface-container rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
              <div className="relative group self-center md:self-start">
                <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl border-4 border-surface-container-high transition-transform group-hover:scale-[1.02]">
                  <img
                    className="w-full h-full object-cover"
                    alt="Professional executive headshot"
                    src={session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDhCAE0XVhzwmG5l_7ZPjYZ0dirwfz1Y9Yj-lR9jao0uiQqOY1bfvEsHlkpf03ogj9K9mMuqWxj3IPUNWaZDMfWc7T1zBxuqyQnWV8-JbEVsN3glIR72lUtJ-CMAoehGH5E9piZUwhW090DNfVyOo-1MbwRuaCeMNQIqeteQrzJ1XEG5MMAlbh8u9pPYOLrz5ZRz3XmFiJn8OrY_qnqpIYvVKO5rRyX2RHvSuRiomhLjPuhmMc_11hebIEmoklICuSi3XrdozigmSc"}
                  />
                </div>
                <button 
                  onClick={handlePhotoClick}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-lg text-on-primary shadow-lg hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
                  title="Change profile photo"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isUploading ? 'sync' : 'edit'}
                  </span>
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-on-surface-variant font-body text-sm tracking-widest uppercase font-semibold mb-4">Identity Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <SettingsInput label="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} />
                  <SettingsInput label="Executive Title" value={title} onChange={(e: any) => setTitle(e.target.value)} />
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-outline font-bold">Professional Biography</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg text-on-surface text-sm focus:ring-2 focus:ring-primary/20 h-24 resize-none p-3 transition-all hover:border-outline-variant/30"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-outline-variant/10">
              <button 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="bg-primary/10 text-primary px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    Updating...
                  </>
                ) : 'Update Profile'}
              </button>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="bg-surface-container rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-on-surface-variant font-body text-sm tracking-widest uppercase font-semibold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">devices</span>
              Manage Sessions
            </h3>
            <div className="space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Device Sessions</p>
                </div>
                
                {isSessionsLoading ? (
                  <div className="py-4 text-center animate-pulse text-[10px] uppercase font-bold tracking-widest opacity-30 text-on-surface">Synchronizing Nodes...</div>
                ) : (
                  <div className="space-y-2">
                    {sessions?.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant/5 hover:bg-surface-container-highest/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${s.id === session?.session?.id ? 'bg-primary/10' : 'bg-on-surface-variant/10'} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-on-surface-variant">{s.userAgent?.toLowerCase().includes('mobile') ? 'smartphone' : 'laptop'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-on-surface">{s.ipAddress || 'Remote Node'}</p>
                              {s.id === session?.session?.id && (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest">Current</span>
                              )}
                            </div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-tight">{s.userAgent || 'Unknown System'}</p>
                          </div>
                        </div>
                        {s.id !== session?.session?.id && (
                          <button 
                            onClick={() => setIsTerminating(s.token)}
                            className="text-[10px] font-bold text-error opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>      </div>

      {/* Footer Utility */}
      <footer className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-on-surface-variant font-medium">
          <a className="hover:text-primary transition-colors" href="#">Privacy Charter</a>
          <a className="hover:text-primary transition-colors" href="#">Service Terms</a>
          <a className="hover:text-primary transition-colors" href="#">Export Workspace Data</a>
        </div>
        <button 
          onClick={() => setIsTerminating('current')}
          className="flex items-center gap-2 text-xs font-bold text-error hover:opacity-80 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Terminate Global Session
        </button>
      </footer>

      {/* Confirmation Modal */}
      {isTerminating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10 shadow-2xl animate-in zoom-in-95 duration-200">
              <span className="material-symbols-outlined text-error text-4xl mb-4">warning</span>
              <h4 className="text-xl font-bold text-on-surface mb-2">
                {isTerminating === 'current' ? 'Log out of Suite?' : 'Terminate Session?'}
              </h4>
              <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                {isTerminating === 'current' 
                  ? 'This will end your current session and require re-authentication to access your architectural workspace.' 
                  : 'This remote device will lose access to your account immediately. This action cannot be undone.'}
              </p>
              <div className="flex gap-4">
                 <button 
                  onClick={() => setIsTerminating(null)}
                  className="flex-1 px-4 py-3 rounded-xl bg-on-surface-variant/10 text-on-surface text-sm font-bold hover:bg-on-surface-variant/20 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                  onClick={() => isTerminating === 'current' ? handleLogout() : handleTerminateSession(isTerminating)}
                  className="flex-1 px-4 py-3 rounded-xl bg-error text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-error/20"
                 >
                   Confirm
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

function SettingsInput({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-outline font-bold">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg text-on-surface text-sm focus:ring-2 focus:ring-primary/20 p-2.5 transition-all hover:border-outline-variant/30"
        type="text"
      />
    </div>
  )
}


export default Settings
