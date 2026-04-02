import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'

interface JobDetailDrawerProps {
  isOpen: boolean
  jobId: string | null
  onClose: () => void
}

const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({ isOpen, jobId, onClose }) => {
  const queryClient = useQueryClient()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [note, setNote] = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [interviewLink, setInterviewLink] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Fetch Job Details
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const res = await api.get(`/jobs/${jobId}`)
      const found = res.data
      if (found) {
        setNote(found.notes || '')
        setInterviewType(found.interviewType || 'Google Meet')
        setInterviewLink(found.interviewLink || '')
        setDeadline(found.deadline ? new Date(found.deadline).toISOString().split('T')[0] : '')
      }
      return found
    },
    enabled: !!jobId && isOpen
  })

  // Fetch Documents
  const { data: documents, refetch: refetchDocs } = useQuery({
    queryKey: ['job-documents', jobId],
    queryFn: async () => {
      if (!jobId) return []
      const res = await api.get(`/jobs/${jobId}/documents`)
      return res.data
    },
    enabled: !!jobId && isOpen
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.patch(`/jobs/${jobId}`, { status: newStatus })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      setIsUpdatingStatus(false)
    }
  })

  const updateJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/jobs/${jobId}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    }
  })

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/documents/${id}`)
    },
    onSuccess: () => {
      refetchDocs()
    }
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !jobId) return

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      await api.post(`/jobs/${jobId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      refetchDocs()
    } catch (err) {
      console.error('Upload Error:', err)
      alert('Failed to upload document via proxy')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Job Detail Slide-over */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-slate-950/70 backdrop-blur-3xl shadow-2xl z-[70] flex flex-col border-l border-white/5 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-4 md:px-8 h-16 bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">close</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Close Detail</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                className="px-5 py-2 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
              
              {isUpdatingStatus && (
                <div className="absolute top-full mt-2 right-0 w-48 glass-panel bg-surface-container-high rounded-xl shadow-2xl z-20 overflow-hidden border border-white/5">
                  {['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'].map((status) => (
                    <button 
                      key={status}
                      onClick={() => updateStatusMutation.mutate(status)}
                      className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5 last:border-0"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8 md:py-12 custom-scrollbar text-on-surface">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-on-surface-variant animate-pulse font-bold tracking-widest uppercase text-xs">Architecting Data...</p>
            </div>
          ) : job ? (
            <>
              {/* Header Section */}
              <section className="mb-8 md:mb-12 flex flex-col sm:flex-row items-start justify-between gap-4 md:gap-6">
                <div className="flex gap-6 items-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-surface-container flex items-center justify-center p-3 md:p-4 shadow-xl shadow-black/40 overflow-hidden shrink-0 rounded-xl md:rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">corporate_fare</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        job.status === 'Applied' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                        job.status === 'Interview' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                        job.status === 'Offer' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                        'bg-outline-variant/10 text-outline-variant border-outline-variant/20'
                      }`}>{job.status}</span>
                      <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-tighter opacity-70">• {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight">{job.role}</h3>
                    <p className="text-lg text-primary font-medium">{job.company}</p>
                  </div>
                </div>
              </section>

              {/* Grid Layout for Content */}
              <div className="grid grid-cols-1 gap-10">
                {/* Interview & Deadlines */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-70 mb-4 text-left">Logistics & Deadlines</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-white/5 space-y-2">
                       <label className="text-[9px] uppercase font-bold text-on-surface-variant/60 block px-1">Interview Type</label>
                       <select 
                         value={interviewType}
                         onChange={(e) => {
                           setInterviewType(e.target.value)
                           updateJobMutation.mutate({ interviewType: e.target.value })
                         }}
                         className="w-full bg-transparent border-none text-sm text-on-surface focus:ring-0 p-0 font-bold"
                       >
                         {['Google Meet', 'Zoom', 'Microsoft Teams', 'On-site', 'Phone'].map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                       </select>
                    </div>
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-white/5 space-y-2 min-w-0">
                       <label className="text-[9px] uppercase font-bold text-on-surface-variant/60 block px-1">
                         {interviewType === 'On-site' ? 'Address' : interviewType === 'Phone' ? 'Phone Number' : 'Interview Link'}
                       </label>
                       <div className="flex items-center gap-2">
                         <input 
                           value={interviewLink}
                           onChange={(e) => setInterviewLink(e.target.value)}
                           onBlur={() => updateJobMutation.mutate({ interviewLink })}
                           placeholder={interviewType === 'On-site' ? 'Enter address' : interviewType === 'Phone' ? 'Enter phone number' : 'Paste link'}
                           className="flex-1 bg-transparent border-none text-sm text-on-surface focus:ring-0 p-0 placeholder:text-outline-variant/40 min-w-0"
                         />
                         {interviewLink && (
                           <a 
                             href={interviewType === 'Phone' ? `tel:${interviewLink}` : interviewType === 'On-site' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(interviewLink)}` : interviewLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-primary hover:text-primary-container p-1 rounded-md hover:bg-primary/10 transition-all flex items-center justify-center shrink-0"
                             title="Open Link"
                           >
                             <span className="material-symbols-outlined text-lg">open_in_new</span>
                           </a>
                         )}
                       </div>
                    </div>
                    <div className="bg-surface-container-lowest p-4 rounded-xl border border-white/5 space-y-2">
                       <label className="text-[9px] uppercase font-bold text-on-surface-variant/60 block px-1 text-error/80">Application Deadline</label>
                       <input 
                         type="date"
                         value={deadline}
                         min={new Date().toISOString().split('T')[0]}
                         onChange={(e) => {
                           setDeadline(e.target.value)
                           updateJobMutation.mutate({ deadline: e.target.value })
                         }}
                         className="w-full bg-transparent border-none text-sm text-error focus:ring-0 p-0 font-bold [color-scheme:dark]"
                       />
                    </div>
                  </div>
                </section>

                {/* Documents Section */}
                <section>
                   <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-70">Job Documents</h4>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-[10px] uppercase font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
                      >
                         <span className="material-symbols-outlined text-sm">{isUploading ? 'sync' : 'add_circle'}</span>
                         {isUploading ? 'Uploading...' : 'Add Document'}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                   </div>
                   
                   <div className="space-y-3">
                      {documents && documents.length > 0 ? (
                        documents.map((doc: any) => (
                          <div key={doc.id} className="bg-surface-container-lowest p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                             <div className="flex items-center gap-3 overflow-hidden">
                                <span className="material-symbols-outlined text-primary/60">description</span>
                                <div className="truncate">
                                   <p className="text-xs font-bold text-on-surface truncate pr-2">{doc.name}</p>
                                   <p className="text-[9px] text-on-surface-variant">Added {new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                  title="View/Download"
                                >
                                   <span className="material-symbols-outlined text-lg">download</span>
                                </a>
                                <button 
                                  onClick={() => deleteDocMutation.mutate(doc.id)}
                                  className="p-2 hover:bg-error/10 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                                  title="Delete Document"
                                >
                                   <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-outline-variant/10 rounded-2xl flex flex-col items-center justify-center opacity-30">
                           <span className="material-symbols-outlined mb-1">upload_file</span>
                           <p className="text-[10px] font-bold uppercase tracking-widest">No documents tracked yet</p>
                        </div>
                      )}
                   </div>
                </section>

                {/* Notes Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-70">Preparation & Notes</h4>
                    {updateJobMutation.isPending && <span className="text-[10px] text-primary animate-pulse font-bold">Saving...</span>}
                  </div>
                  <div className="bg-surface-container-lowest rounded-2xl p-6 border border-white/5 relative overflow-hidden group text-left">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onBlur={() => updateJobMutation.mutate({ notes: note })}
                      className="w-full bg-transparent border-none focus:ring-0 text-on-surface leading-relaxed text-sm h-32 resize-none placeholder:text-outline-variant"
                      placeholder="Add strategic notes, interview questions, or follow-up points..."
                    />
                  </div>
                </section>

                {/* Pipeline Insight */}
                <section className="bg-surface-container-high/30 p-6 rounded-2xl border border-white/5 text-left">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                         <span className="material-symbols-outlined text-primary text-xl">insights</span>
                      </div>
                      <div>
                         <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pipeline Insight</p>
                         <p className="text-sm">Currently in <span className="text-primary font-bold">{job.status}</span> stage. Stay focused on the value proposition.</p>
                      </div>
                   </div>
                </section>

                <div className="pt-10 border-t border-white/5 flex justify-end">
                   <button 
                     onClick={onClose}
                     className="px-8 py-3 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface transition-all"
                   >
                     Done Reviewing
                   </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <span className="material-symbols-outlined text-6xl mb-4">error</span>
              <p className="font-bold uppercase tracking-widest text-sm">Target Not Found</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default JobDetailDrawer
