import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import JobDetailDrawer from '../components/JobDetailDrawer'
import JobModal from '../components/JobModal'
import ConfirmDialog from '../components/ConfirmDialog'

const TrackingBoard = () => {
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentJob, setCurrentJob] = useState<any>(null)
  
  // Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: async (newJob: any) => {
      const res = await api.post('/jobs', newJob)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      setIsModalOpen(false)
    }
  })

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/jobs/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      setIsModalOpen(false)
    }
  })

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      setIsConfirmOpen(false)
      setJobToDelete(null)
    }
  })

  // Fetch Jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs')
      return res.data
    }
  })

  // Group jobs by status
  const columns = {
    Wishlist: jobs?.filter((j: any) => j.status === 'Wishlist') || [],
    Applied: jobs?.filter((j: any) => j.status === 'Applied') || [],
    Interview: jobs?.filter((j: any) => j.status === 'Interview') || [],
    Offer: jobs?.filter((j: any) => j.status === 'Offer') || [],
    Rejected: jobs?.filter((j: any) => j.status === 'Rejected') || []
  }

  const handleOpenCreate = () => {
    setIsEditMode(false)
    setCurrentJob(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (job: any) => {
    setIsEditMode(true)
    setCurrentJob(job)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (id: string) => {
    setJobToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleCardClick = (id: string) => {
    setSelectedJobId(id)
    setIsDrawerOpen(true)
  }

  const location = useLocation()

  // Handle opening modal from navigation state
  useEffect(() => {
    if ((location.state as any)?.openAddModal) {
      handleOpenCreate()
      // Clear the state so it doesn't open again on refresh
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  return (
    <>
      <div className="flex flex-col h-full transition-all duration-300">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Job Application Pipeline</h1>
            <p className="text-on-surface-variant max-w-2xl font-medium">Architect your career path. Manage your active pursuits across stages with executive precision.</p>
          </div>
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/10">
            {jobs?.length || 0} Total Pursuits
          </div>
        </div>
        
        {/* Kanban Board */}
        <div className="flex gap-6 pb-8 overflow-x-auto custom-scrollbar flex-1 items-start">
          {Object.entries(columns).map(([status, items]) => (
            <section key={status} className="kanban-column flex flex-col gap-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'Wishlist' ? 'bg-outline-variant' :
                    status === 'Applied' ? 'bg-amber-400' :
                    status === 'Interview' ? 'bg-secondary' :
                    status === 'Offer' ? 'bg-tertiary' : 'bg-error'
                  }`}></span>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">{status}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant">
                    {items.length.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[1, 2].map(i => <div key={i} className="h-32 bg-surface-container rounded-2xl"></div>)}
                </div>
              ) : items.length > 0 ? (
                items.map((job: any) => (
                  <KanbanCard
                    key={job.id}
                    id={job.id}
                    company={job.company}
                    role={job.role}
                    added={new Date(job.createdAt).toLocaleDateString()}
                    location={job.location}
                    workArrangement={job.workArrangement}
                    team={job.team}
                    color={
                      status === 'Applied' ? '#F59E0B' :
                      status === 'Interview' ? '#8B5CF6' :
                      status === 'Offer' ? '#10B981' :
                      status === 'Rejected' ? '#EF4444' : ''
                    }
                    onClick={() => handleCardClick(job.id)}
                    onEdit={(e: any) => {
                       e.stopPropagation()
                       handleOpenEdit(job)
                    }}
                    onDelete={(e: any) => {
                       e.stopPropagation()
                       handleOpenDelete(job.id)
                    }}
                  />
                ))
              ) : (
                <div className="border-2 border-dashed border-outline-variant/10 rounded-2xl py-10 flex flex-col items-center justify-center opacity-20">
                  <span className="material-symbols-outlined text-3xl mb-2">inventory_2</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">No entries</span>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* Float FAB */}
      {!isModalOpen && !isDrawerOpen && !isConfirmOpen && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
          <button 
            onClick={handleOpenCreate}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container shadow-2xl shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group"
          >
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
            <span className="absolute right-full mr-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">New Entry</span>
          </button>
        </div>
      )}
      
      {/* Shared Job Modal */}
      <JobModal 
        isOpen={isModalOpen}
        isEdit={isEditMode}
        jobData={currentJob}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          if (isEditMode) {
             updateJobMutation.mutate({ id: currentJob.id, data })
          } else {
             createJobMutation.mutate(data)
          }
        }}
        isSubmitting={createJobMutation.isPending || updateJobMutation.isPending}
        error={createJobMutation.error?.message || (createJobMutation.error as any)?.response?.data?.details || updateJobMutation.error?.message || (updateJobMutation.error as any)?.response?.data?.details}
      />

      {/* Custom Delete Confirmation */}
      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Remove Pursuit"
        message="Are you sure you want to permanently remove this application pursuit from your pipeline? This will also delete any related logs."
        confirmText="Confirm Removal"
        cancelText="Nevermind"
        onConfirm={() => jobToDelete && deleteJobMutation.mutate(jobToDelete)}
        onCancel={() => {
            setIsConfirmOpen(false)
            setJobToDelete(null)
        }}
        isDangerous={true}
      />

      <JobDetailDrawer 
        isOpen={isDrawerOpen} 
        jobId={selectedJobId} 
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedJobId(null)
        }} 
      />
    </>
  )
}

function KanbanCard({ id, company, role, added, location, workArrangement, team, color, onClick, onEdit, onDelete }: any) {
  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500']
    const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div 
      onClick={onClick}
      className="glass-card p-5 rounded-2xl group cursor-pointer hover:bg-surface-container-high transition-all border-l-4 relative overflow-hidden" 
      style={{ borderLeftColor: color || 'rgba(255,255,255,0.1)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant/10 overflow-hidden shadow-inner ${getAvatarColor(company)}`}>
           <span className="text-white font-bold text-sm">{company.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter">Added</span>
           <span className="text-[10px] font-bold text-on-surface">{added}</span>
        </div>
      </div>

      <h4 className="text-base font-bold text-on-surface leading-tight mb-1">{role}</h4>
      <p className="text-[10px] text-primary/70 font-heavy uppercase tracking-widest mb-3">{team || 'Engineering'}</p>
      
      <p className="text-sm font-bold text-on-surface-variant/80 mb-4">{company}</p>

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/60">
           <span className="text-primary/70">{workArrangement || 'Remote'}</span>
           {location && (
             <>
               <span className="w-1 h-1 rounded-full bg-outline/20"></span>
               <span>{location}</span>
             </>
           )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={onEdit} className="p-1.5 hover:bg-secondary/10 rounded-md text-secondary transition-colors">
              <span className="material-symbols-outlined text-base">edit</span>
           </button>
           <button onClick={onDelete} className="p-1.5 hover:bg-error/10 rounded-md text-error transition-colors">
              <span className="material-symbols-outlined text-base">delete</span>
           </button>
        </div>
      </div>

      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -mr-12 -mt-12 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  )
}

export default TrackingBoard
