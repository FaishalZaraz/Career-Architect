import React, { useState, useEffect } from 'react'

interface JobModalProps {
  isOpen: boolean
  isEdit: boolean
  jobData?: any
  onClose: () => void
  onSubmit: (data: any) => void
  isSubmitting: boolean
  error?: string | null
}

const JobModal: React.FC<JobModalProps> = ({ isOpen, isEdit, jobData, onClose, onSubmit, isSubmitting, error }) => {
  const [selectedTeam, setSelectedTeam] = useState(isEdit ? (jobData?.team || 'Engineering') : 'Engineering')
  const [customTeam, setCustomTeam] = useState('')
  const [showCustomTeam, setShowCustomTeam] = useState(false)

  const teams = ['Engineering', 'Product', 'Design', 'Marketing', 'Finance', 'HR', 'Other...']

  useEffect(() => {
    if (isEdit && jobData?.team && !teams.includes(jobData.team)) {
      setSelectedTeam('Other...')
      setCustomTeam(jobData.team)
      setShowCustomTeam(true)
    } else if (isEdit && jobData?.team) {
      setSelectedTeam(jobData.team)
    }
  }, [isEdit, jobData])

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedTeam(val)
    setShowCustomTeam(val === 'Other...')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const finalTeam = selectedTeam === 'Other...' ? customTeam : selectedTeam
    
    const data = {
      company: formData.get('company'),
      role: formData.get('role'),
      status: formData.get('status'),
      location: formData.get('location'),
      workArrangement: formData.get('workArrangement'),
      team: finalTeam,
      source: formData.get('source'),
    }
    onSubmit(data)
  }

  if (!isOpen) return null

  const sources = ['LinkedIn', 'Referral', 'Indeed', 'Glassdoor', 'Direct', 'Other']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <form 
        onSubmit={handleSubmit}
        className="bg-surface-container-high rounded-2xl p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-200"
      >
        <h3 className="text-xl font-extrabold tracking-tight mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">{isEdit ? 'edit_note' : 'bolt'}</span>
          {isEdit ? 'Update Application' : 'Quick Application Add'}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-[10px] uppercase font-bold tracking-widest animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Target Company</label>
              <input name="company" defaultValue={isEdit ? jobData?.company : ''} required className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Google" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Source</label>
              <select name="source" defaultValue={isEdit ? jobData?.source : 'Direct'} className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all">
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Proposed Role</label>
            <input name="role" defaultValue={isEdit ? jobData?.role : ''} required className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Senior Software Architect" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Arrangement</label>
              <select name="workArrangement" defaultValue={isEdit ? jobData?.workArrangement : 'Remote'} className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all">
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Status</label>
              <select name="status" defaultValue={isEdit ? jobData?.status : 'Applied'} className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all">
                <option value="Wishlist">Wishlist</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Location</label>
            <input name="location" defaultValue={isEdit ? jobData?.location : ''} className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Jakarta, Remote, New York" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2 px-1">Team / Department</label>
            <select 
              value={selectedTeam} 
              onChange={handleTeamChange}
              className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all mb-2"
            >
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {showCustomTeam && (
              <input 
                value={customTeam}
                onChange={(e) => setCustomTeam(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all animate-in slide-in-from-top-1" 
                placeholder="Enter custom team name..." 
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-surface-container-highest rounded-xl text-xs font-bold hover:bg-surface-bright transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Entry' : 'Add Application'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default JobModal
