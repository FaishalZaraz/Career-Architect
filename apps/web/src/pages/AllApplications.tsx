import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import JobDetailDrawer from '../components/JobDetailDrawer'
import JobModal from '../components/JobModal'
import ConfirmDialog from '../components/ConfirmDialog'

const AllApplications = () => {
  const queryClient = useQueryClient()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentJob, setCurrentJob] = useState<any>(null)
  
  // Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Apps')
  const [sortBy, setSortBy] = useState('applied-desc')
  const [isSortOpen, setIsSortOpen] = useState(false)

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs')
      return res.data
    }
  })

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary')
      return res.data
    }
  })

  // Mutations
  const addJobMutation = useMutation({
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

  const filteredAndSortedJobs = React.useMemo(() => {
    let result = jobs?.filter((job: any) => {
      const matchesSearch = 
        job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.role?.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (activeFilter === 'All Apps') return matchesSearch
      return matchesSearch && job.status?.toLowerCase() === activeFilter.toLowerCase()
    }) || []

    return result.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'applied-desc':
          return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        case 'applied-asc':
          return new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
        case 'company':
          return a.company.localeCompare(b.company)
        case 'location':
          return (a.location || '').localeCompare(b.location || '')
        case 'deadline':
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        default:
          return 0
      }
    })
  }, [jobs, searchQuery, activeFilter, sortBy])

  const sortOptions = [
    { id: 'applied-desc', label: 'Date Applied (Newest)', icon: 'calendar_today' },
    { id: 'applied-asc', label: 'Date Applied (Oldest)', icon: 'history' },
    { id: 'deadline', label: 'Next Deadline', icon: 'alarm_on' },
    { id: 'company', label: 'Company (A-Z)', icon: 'business' },
    { id: 'location', label: 'Location (A-Z)', icon: 'location_on' },
  ]

  const activeSortLabel = sortOptions.find(o => o.id === sortBy)?.label || 'Newest'

  const stats = summary || {
    totalApplications: 0,
    interviewsCount: 0,
    offersCount: 0
  }

  return (
    <>
    <div onClick={() => isSortOpen && setIsSortOpen(false)}>
      <div className="flex flex-col gap-10 transition-all duration-300">
      {/* Page Header & Stats Bento */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Application Tracking Board</h1>
          <p className="text-on-surface-variant max-w-lg">Manage your high-stakes opportunities with architectural precision. Filter through <span className="text-primary font-bold">{stats.totalApplications}</span> roles and active entries.</p>
        </div>
        <div className="col-span-12 lg:col-span-6 grid grid-cols-3 gap-4">
          <StatBox label="Total" value={isSummaryLoading ? '...' : stats.totalApplications} color="primary" />
          <StatBox label="Interviews" value={isSummaryLoading ? '...' : stats.interviewsCount} color="tertiary" />
          <StatBox label="Offers" value={isSummaryLoading ? '...' : stats.offersCount} color="error" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['All Apps', 'Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`${activeFilter === filter ? 'bg-primary text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'} px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/10 group focus-within:border-primary/40 transition-colors">
            <span className="material-symbols-outlined text-sm text-outline group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search companies or roles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs w-48 text-on-surface placeholder:text-outline/40 p-0"
            />
          </div>
          
          {/* Advanced Sort Dropdown */}
          <div className="relative">
            <div 
              onClick={(e) => {
                e.stopPropagation()
                setIsSortOpen(!isSortOpen)
              }}
              className={`flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/10 cursor-pointer transition-all ${isSortOpen ? 'border-primary ring-1 ring-primary/20 bg-surface-bright' : 'hover:bg-surface-bright'}`}
            >
              <span className={`material-symbols-outlined text-sm ${isSortOpen ? 'text-primary' : 'text-outline'}`}>sort</span>
              <span className="text-xs font-medium">{activeSortLabel}</span>
              <span className={`material-symbols-outlined text-xs transition-transform ${isSortOpen ? 'rotate-180 text-primary' : 'text-outline'}`}>expand_more</span>
            </div>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-highest rounded-xl shadow-2xl border border-white/10 z-[60] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/60">Sort Applications By</p>
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id)
                      setIsSortOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-white/5 ${sortBy === option.id ? 'text-primary font-bold bg-primary/10' : 'text-on-surface font-medium'}`}
                  >
                    <span className={`material-symbols-outlined text-base ${sortBy === option.id ? 'text-primary' : 'text-on-surface-variant'}`}>{option.icon}</span>
                    {option.label}
                    {sortBy === option.id && <span className="material-symbols-outlined text-sm ml-auto text-primary">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Company</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Role</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Status</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Date Applied</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {isJobsLoading ? (
              [1, 2, 3, 4].map(idx => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8 bg-white/5 opacity-10"></td>
                </tr>
              ))
            ) : filteredAndSortedJobs.length > 0 ? (
              filteredAndSortedJobs.map((app: any) => (
                <TableRow 
                  key={app.id} 
                  {...app} 
                  onView={() => {
                    setSelectedJobId(app.id)
                    setIsDrawerOpen(true)
                  }} 
                  onEdit={() => handleOpenEdit(app)}
                  onDelete={() => handleOpenDelete(app.id)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                   <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 block mb-2">search_off</span>
                   <p className="text-on-surface-variant text-sm font-medium tracking-wide">No applications found matching your request.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Summary */}
        <div className="px-6 py-4 bg-surface-container-high/30 flex items-center justify-between border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant">
            Showing <span className="text-on-surface font-bold">{filteredAndSortedJobs.length}</span> results 
            {activeFilter !== 'All Apps' && <span> for <span className="text-primary font-bold">{activeFilter}</span></span>}
          </p>
          <div className="flex items-center gap-2 opacity-50 pointer-events-none">
            <span className="text-[10px] uppercase font-bold tracking-tighter">Navigation Locked In Preview</span>
          </div>
        </div>
      </div>
      
      {/* FAB Quick Add */}
      {!isConfirmOpen && !isModalOpen && !isDrawerOpen && (
        <button 
            onClick={handleOpenCreate}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            <div className="absolute right-full mr-4 bg-surface-bright px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-outline-variant/10 shadow-xl">Quick Add Tracking</div>
        </button>
      )}
      </div>
      
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
            addJobMutation.mutate(data)
          }
        }}
        isSubmitting={addJobMutation.isPending || updateJobMutation.isPending}
        error={addJobMutation.error?.message || (addJobMutation.error as any)?.response?.data?.details || updateJobMutation.error?.message || (updateJobMutation.error as any)?.response?.data?.details}
      />
      
      {/* Custom Delete Confirmation */}
      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Remove Application"
        message="Are you sure you want to permanently remove this application pursuit? This will also delete any related activity logs and documents."
        confirmText="Confirm Removal"
        cancelText="Nevermind"
        onConfirm={() => jobToDelete && deleteJobMutation.mutate(jobToDelete)}
        onCancel={() => {
            setIsConfirmOpen(false)
            setJobToDelete(null)
        }}
        isDangerous={true}
      />
      
      <JobDetailDrawer isOpen={isDrawerOpen} jobId={selectedJobId} onClose={() => setIsDrawerOpen(false)} />
      </div>
    </>
  )
}

function StatBox({ label, value, color }: any) {
  const colorMap: any = {
    primary: 'text-on-surface',
    tertiary: 'text-tertiary',
    error: 'text-error'
  }
  const bgMap: any = {
    primary: 'bg-primary/20',
    tertiary: 'bg-tertiary/20',
    error: 'bg-error/20'
  }
  const gradientMap: any = {
    primary: 'from-primary/5',
    tertiary: 'from-tertiary/5',
    error: 'from-error/5'
  }

  return (
    <div className="bg-surface-container-high rounded-xl p-4 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-t ${gradientMap[color]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
      <p className={`text-2xl font-bold tracking-tighter ${colorMap[color]}`}>{value}</p>
      <div className={`absolute bottom-0 left-0 w-full h-0.5 ${bgMap[color]}`}></div>
    </div>
  )
}

function TableRow({ id, company, location, role, team, status, workArrangement, date, logoUrl, createdAt, onView, onEdit, onDelete }: any) {
  const statusColorMap: any = {
    'Wishlist': 'primary',
    'Applied': 'secondary',
    'Interview': 'tertiary',
    'Offer': 'secondary',
    'Rejected': 'error'
  }
  
  const statusColor = statusColorMap[status] || 'primary'
  const displayDate = date ? new Date(date).toLocaleDateString() : new Date(createdAt).toLocaleDateString()

  const statusBgMap: any = {
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    primary: 'bg-primary/10 text-primary',
    error: 'bg-error/10 text-error'
  }
  const dotColorMap: any = {
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    primary: 'bg-primary',
    error: 'bg-error'
  }

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500']
    const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant/20 overflow-hidden shadow-inner ${!logoUrl ? getAvatarColor(company) : 'bg-black'}`}>
            {logoUrl ? (
              <img alt={`${company} Logo`} className="w-full h-full object-cover" src={logoUrl} />
            ) : (
              <span className="text-white font-bold text-sm">{company?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-on-surface leading-tight">{company}</p>
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-primary/70">{workArrangement || 'Remote'}</span>
              {location && (
                <>
                  <span className="w-1 h-1 rounded-full bg-outline/30"></span>
                  <span>{location}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <p className="text-sm font-bold text-on-surface">{role}</p>
        <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest mt-0.5">{team || 'Engineering'}</p>
      </td>
      <td className="px-6 py-5">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusBgMap[statusColor]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[statusColor]} mr-1.5 ${statusColor === 'secondary' ? 'animate-pulse' : ''}`}></span>
          {status}
        </span>
      </td>
      <td className="px-6 py-5">
        <p className="text-xs text-on-surface-variant font-medium">{displayDate}</p>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onView}
            className="p-2 hover:bg-primary/10 rounded-lg text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 group/btn"
          >
            <span className="material-symbols-outlined text-lg">visibility</span>
          </button>
          <button 
            onClick={onEdit}
            className="p-2 hover:bg-secondary/10 rounded-lg text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button 
            onClick={onDelete}
            className="p-2 hover:bg-error/10 rounded-lg text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </td>
    </tr>
  )
}

export default AllApplications
