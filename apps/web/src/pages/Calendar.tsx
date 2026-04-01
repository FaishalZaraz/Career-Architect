import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useCalendar } from '../context/CalendarContext'
import JobDetailDrawer from '../components/JobDetailDrawer'

const Calendar = () => {
  const { currentDate, setCurrentDate, viewMode, setViewMode, next, prev, today } = useCalendar()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs')
      return res.data
    }
  })

  const handleOpenDetail = (id: string) => {
    setSelectedJobId(id)
    setIsDrawerOpen(true)
  }

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  
  const getMonthDays = () => {
    const days = []
    const prevMonthDays = daysInMonth(year, month - 1)
    const firstDay = (firstDayOfMonth(year, month) + 6) % 7 // Align to Mon starting
    
    for (let i = firstDay - 1; i >= 0; i--) {
       days.push({ date: new Date(year, month - 1, prevMonthDays - i), currentMonth: false })
    }
    for (let i = 1; i <= daysInMonth(year, month); i++) {
       days.push({ date: new Date(year, month, i), currentMonth: true })
    }
    const totalCells = 42
    const nextMonthPadding = totalCells - days.length
    for (let i = 1; i <= nextMonthPadding; i++) {
       days.push({ date: new Date(year, month + 1, i), currentMonth: false })
    }
    return days
  }

  const getWeekDays = () => {
    const days = []
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    startOfWeek.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
       const date = new Date(startOfWeek)
       date.setDate(startOfWeek.getDate() + i)
       days.push({ date, currentMonth: true })
    }
    return days
  }

  const displayDays = viewMode === 'month' ? getMonthDays() : getWeekDays()

  const getEventsForDate = (date: Date) => {
    if (!jobs) return []
    return jobs.filter((job: any) => {
      if (!job.deadline) return false
      const d = new Date(job.deadline)
      return d.getDate() === date.getDate() && 
             d.getMonth() === date.getMonth() && 
             d.getFullYear() === date.getFullYear()
    })
  }

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const futureJobs = jobs?.filter((job: any) => {
    if (!job.deadline) return false
    return new Date(job.deadline) >= todayDate
  }) || []

  const lastDeadline = futureJobs.length > 0 
    ? new Date(Math.max(...futureJobs.map((j: any) => new Date(j.deadline).getTime())))
    : null
  
  const daysToLast = lastDeadline 
    ? Math.ceil((lastDeadline.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const upcomingDeadlines = [...futureJobs].sort((a: any, b: any) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )

  return (
    <>
    <div className="flex -m-8 h-[calc(100vh-64px)] overflow-hidden">
      {/* Calendar Grid Section */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-surface-container-low">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-1">{monthName} {year}</h1>
            <p className="text-on-surface-variant text-sm">Visualizing your path to the next career milestone.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex bg-surface-container rounded-lg p-1">
              <button 
                onClick={prev}
                className="p-2 hover:bg-white/5 rounded-md transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button 
                onClick={today}
                className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 rounded-md transition-colors"
              >
                 Today
              </button>
              <button 
                onClick={next}
                className="p-2 hover:bg-white/5 rounded-md transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            <div className="flex gap-1 bg-surface-container p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-surface-container-high text-on-surface shadow-sm inner-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-surface-container-high text-on-surface shadow-sm inner-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-outline-variant/10">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container-highest">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{day}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[minmax(120px,auto)]' : 'h-[500px]'}`}>
            {isLoading ? (
               <div className="col-span-7 py-20 text-center animate-pulse uppercase font-bold tracking-widest text-xs opacity-30">Synchronizing Timelines...</div>
            ) : displayDays.map((dayObj, idx) => {
              const events = getEventsForDate(dayObj.date)
              const isToday = dayObj.date.toDateString() === new Date().toDateString()
              
              return (
                <div key={idx} className={`p-2 border-r border-b border-outline-variant/5 hover:bg-surface-bright/5 transition-colors relative group ${!dayObj.currentMonth ? 'bg-surface-container-low/30 opacity-30 text-outline-variant/20' : ''} ${isToday ? 'ring-1 ring-primary/30 bg-primary/5' : ''}`}>
                  <span className={`text-xs font-medium px-1 ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                    {dayObj.date.getDate() < 10 ? `0${dayObj.date.getDate()}` : dayObj.date.getDate()}
                  </span>
                  
                  <div className="mt-2 flex flex-col gap-1">
                    {events.map((job: any) => (
                      <CalendarEvent 
                        key={job.id} 
                        job={job}
                        onClick={() => handleOpenDetail(job.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mt-10 grid grid-cols-3 gap-6">
          <StatMini label="Active Pursuits" value={jobs?.length || 0} sub="Managed" color="secondary" />
          <StatMini label="Offers Pending" value={jobs?.filter((j: any) => j.status === 'Offer').length || 0} sub="High Probability" color="tertiary" />
          <StatMini label="Upcoming Deadlines" value={upcomingDeadlines.length} sub={daysToLast > 0 ? `Next ${daysToLast} days` : 'No deadlines'} color="primary" />
        </div>
      </div>

      {/* Today's Agenda Sidebar */}
      <aside className="w-96 border-l border-outline-variant/10 bg-surface-container flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold text-on-surface">Timeline Observer</h2>
          <p className="text-xs text-on-surface-variant mt-1">{new Date().toLocaleDateString('default', { weekday: 'long', month: 'short', day: '2-digit' })}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Deadlines Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Upcoming Deadlines</h3>
            {upcomingDeadlines.length > 0 ? (
               upcomingDeadlines.map((job: any) => (
                 <AgendaItem
                   key={job.id}
                   job={job}
                   onClick={() => handleOpenDetail(job.id)}
                 />
               ))
            ) : (
               <p className="text-[10px] text-on-surface-variant font-bold opacity-30 italic">No pressing deadlines detected.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
    
    <JobDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        jobId={selectedJobId}
      />
    </>
  )
}

function CalendarEvent({ job, onClick }: any) {
  const isApplied = job.status === 'Applied'
  const color = isApplied ? 'secondary' : 'error'

  const bgMap: any = {
    secondary: 'bg-secondary-container/20 border-secondary text-secondary',
    error: 'bg-error-container/20 border-error text-error',
    primary: 'bg-primary-container/20 border-primary text-primary'
  }

  // Label based on interview type as requested
  const logisticalDetail = job.interviewLink ? (
    <div className="mt-1 flex items-center gap-1 opacity-70 scale-90 origin-left">
      <span className="material-symbols-outlined text-[10px]">
        {job.interviewType === 'On-site' ? 'location_on' : job.interviewType === 'Phone' ? 'phone' : 'link'}
      </span>
      <a 
        href={job.interviewType === 'Phone' ? `tel:${job.interviewLink}` : job.interviewType === 'On-site' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.interviewLink)}` : job.interviewLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="truncate max-w-[80px] hover:underline hover:text-on-surface transition-colors"
      >
        {job.interviewLink}
      </a>
    </div>
  ) : null

  return (
    <div 
      onClick={onClick}
      className={`px-2 py-1.5 rounded border-l-2 ${bgMap[color] || bgMap.primary} transition-all hover:opacity-80 active:scale-95 cursor-pointer`}
    >
      <p className="text-[10px] font-bold truncate leading-tight">{job.company}</p>
      {logisticalDetail}
    </div>
  )
}

function StatMini({ label, value, sub, color }: any) {
  const colorMap: any = {
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    primary: 'text-primary'
  }
  return (
    <div className="p-6 rounded-xl bg-surface-container-high inner-glow relative overflow-hidden group">
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-${color}/5 rounded-full blur-2xl group-hover:bg-${color}/10 transition-all`}></div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tighter text-on-surface">{value.toString().padStart(2, '0')}</span>
        <span className={`${colorMap[color]} text-xs font-semibold`}>{sub}</span>
      </div>
    </div>
  )
}

function AgendaItem({ job, onClick }: any) {
  const isApplied = job.status === 'Applied'
  const color = isApplied ? 'secondary' : 'error'

  const borderMap: any = {
    secondary: 'border-secondary',
    primary: 'border-primary',
    error: 'border-error'
  }
  const badgeMap: any = {
    secondary: 'bg-secondary/10 text-secondary',
    primary: 'bg-primary/10 text-primary',
    error: 'bg-error/10 text-error'
  }

  const detailLabel = job.interviewType === 'On-site' ? 'Address' : job.interviewType === 'Phone' ? 'Phone' : 'Link'

  return (
    <div 
      onClick={onClick}
      className={`group relative p-4 rounded-xl bg-surface-container-high inner-glow border-l-4 ${borderMap[color] || borderMap.primary} transition-all hover:bg-surface-bright cursor-pointer shadow-sm active:scale-95`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded-full ${badgeMap[color] || badgeMap.primary} text-[10px] font-bold uppercase`}>Deadline</span>
        <span className="text-[10px] font-semibold text-on-surface-variant">{new Date(job.deadline).toLocaleDateString()}</span>
      </div>
      <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{job.role}</h4>
      <p className="text-xs text-on-surface-variant mb-3">{job.company}</p>
      
      {job.interviewLink && (
        <div className="flex items-center gap-2 py-2 px-3 bg-black/20 rounded-lg border border-white/5 group/link relative z-[2]">
           <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover/link:text-primary transition-colors">
              {job.interviewType === 'On-site' ? 'location_on' : job.interviewType === 'Phone' ? 'phone' : 'link'}
           </span>
           <div className="overflow-hidden flex-1">
              <p className="text-[9px] uppercase font-bold text-outline-variant/60 tracking-widest">{detailLabel}</p>
              <a 
                href={job.interviewType === 'Phone' ? `tel:${job.interviewLink}` : job.interviewType === 'On-site' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.interviewLink)}` : job.interviewLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold text-on-surface truncate block hover:text-primary hover:underline transition-all"
              >
                {job.interviewLink}
              </a>
           </div>
           <span className="material-symbols-outlined text-[10px] text-primary opacity-0 group-hover/link:opacity-100 transition-opacity">open_in_new</span>
        </div>
      )}
    </div>
  )
}

export default Calendar
