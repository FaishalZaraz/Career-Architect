import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useCalendar } from '../context/CalendarContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { setCurrentDate } = useCalendar()

  const [chartRange, setChartRange] = useState(6)

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary')
      return res.data
    }
  })

  const { data: activity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['analytics-activity', chartRange],
    queryFn: async () => {
      const res = await api.get(`/analytics/activity?range=${chartRange}`)
      return res.data
    }
  })

  const { data: upcomingInterviews, isLoading: isInterviewsLoading } = useQuery({
    queryKey: ['upcoming-interviews'],
    queryFn: async () => {
      const res = await api.get('/analytics/upcoming-interviews')
      return res.data
    }
  })

  const { data: recentJobs, isLoading: isRecentLoading } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: async () => {
      const res = await api.get('/analytics/recent')
      return res.data
    }
  })

  const handleDownloadReport = async () => {
    try {
      const res = await api.get('/jobs')
      const jobs = res.data
      
      if (!jobs || jobs.length === 0) {
        alert('No data available to export.')
        return
      }

      // Simple CSV generation
      const headers = ['Company', 'Role', 'Status', 'Location', 'Salary Min', 'Salary Max', 'Created At']
      const csvRows = [
        headers.join(','),
        ...jobs.map((job: any) => [
          `"${job.company}"`,
          `"${job.role}"`,
          `"${job.status}"`,
          `"${job.location || ''}"`,
          job.salaryMin || '',
          job.salaryMax || '',
          new Date(job.createdAt).toLocaleDateString()
        ].join(','))
      ]
      
      const csvString = csvRows.join('\n')
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `JobTracker_Report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to generate report.')
    }
  }

  const handleLiveInsights = () => {
    navigate('/analytics')
  }

  // Process activity data for bar chart
  const getChartMonths = (range: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const result = []
    const d = new Date()
    for (let i = range - 1; i >= 0; i--) {
      const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1)
      result.push(months[monthDate.getMonth()])
    }
    return result
  }

  const chartMonths = getChartMonths(chartRange)
  const chartData = chartMonths.map(m => {
    const record = activity?.find((a: any) => a.month === m)
    return record ? Number(record.count) : 0
  })

  const maxCount = Math.max(...chartData, 5) // Min scale of 5

  // Format statistics for display
  const stats = summary || {
    totalApplications: 0,
    interviewsCount: 0,
    offersCount: 0,
    rejectionRate: 0
  }

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter text-on-surface mb-1">Executive Dashboard</h2>
          <p className="text-on-surface-variant font-medium">Monitoring your career trajectory for <span className="text-primary">Live Optimization</span>.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadReport}
            className="bg-surface-container-high px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-all border border-transparent hover:border-outline-variant/20"
          >
            Download Report
          </button>
          <button 
            onClick={handleLiveInsights}
            className="bg-primary/10 px-4 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
          >
            Live Insights
          </button>
        </div>
      </div>

      {/* Top Row: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Applications" 
          value={isSummaryLoading ? '...' : stats.totalApplications} 
          subtitle="All Time" 
          icon="work" 
          color="primary" 
        />
        <SummaryCard 
          title="Active Interviews" 
          value={isSummaryLoading ? '...' : stats.interviewsCount} 
          subtitle="Pipeline" 
          icon="video_chat" 
          color="secondary" 
        />
        <SummaryCard 
          title="Offers Received" 
          value={isSummaryLoading ? '...' : stats.offersCount} 
          subtitle="Goal" 
          icon="verified_user" 
          color="tertiary" 
        />
        <SummaryCard 
          title="Rejection Rate" 
          value={isSummaryLoading ? '...' : `${Number(stats?.rejectionRate || 0).toFixed(1)}%`} 
          subtitle="Accuracy" 
          icon="block" 
          color="error" 
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Interviews */}
        <div className="lg:col-span-2 glass-panel inner-glow rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold tracking-tight text-on-surface">Upcoming Interviews</h4>
              <p className="text-sm text-on-surface-variant">Your full interview schedule</p>
            </div>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-primary text-sm font-bold hover:underline"
            >
              View Calendar
            </button>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {isInterviewsLoading ? (
              <p className="text-sm text-on-surface-variant italic">Loading schedules...</p>
            ) : upcomingInterviews?.length > 0 ? (
              upcomingInterviews.map((interview: any) => {
                const date = new Date(interview.time)
                
                // Relative date logic
                const today = new Date()
                today.setHours(0,0,0,0)
                const tomorrow = new Date(today)
                tomorrow.setDate(today.getDate() + 1)
                const eventDate = new Date(date)
                eventDate.setHours(0,0,0,0)

                let relativeLabel = ''
                if (eventDate.getTime() === today.getTime()) {
                  relativeLabel = 'Now'
                } else if (eventDate.getTime() === tomorrow.getTime()) {
                  relativeLabel = 'Tomorrow'
                } else {
                  relativeLabel = date.toLocaleDateString('default', { month: 'short', day: 'numeric' })
                }

                const displayType = interview.source === 'log' 
                  ? `Round • ${relativeLabel}` 
                  : `Deadline • ${relativeLabel}`

                return (
                  <InterviewItem 
                    key={interview.id}
                    date={date.getDate()}
                    month={date.toLocaleString('default', { month: 'short' }).toUpperCase()}
                    company={interview.company}
                    role={interview.role}
                    round={interview.title}
                    onClick={() => {
                      setCurrentDate(date)
                      navigate('/calendar')
                    }}
                    type={displayType}
                    color="primary"
                  />
                )
              })
            ) : (
              <p className="text-sm text-outline-variant italic">No interviews scheduled recently.</p>
            )}
          </div>
        </div>

        {/* Recent Applications Quick View */}
        <div className="glass-panel inner-glow rounded-xl p-8 flex flex-col">
          <div className="mb-8">
            <h4 className="text-xl font-bold tracking-tight text-on-surface">Recent Submissions</h4>
            <p className="text-sm text-on-surface-variant">Latest status updates</p>
          </div>
          <div className="space-y-6 flex-1">
            {isRecentLoading ? (
              <p className="text-sm text-on-surface-variant">Loading records...</p>
            ) : recentJobs?.length > 0 ? (
              recentJobs.map((job: any) => (
                <SubmissionItem 
                  key={job.id}
                  company={job.company} 
                  role={job.role} 
                  time={new Date(job.createdAt).toLocaleDateString()} 
                  statusColor={job.status === 'Applied' ? 'bg-primary' : job.status === 'Interview' ? 'bg-secondary' : 'bg-outline-variant'} 
                />
              ))
            ) : (
              <p className="text-sm text-outline-variant">No applications yet. Start building!</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/applications')}
            className="w-full mt-6 py-3 rounded-lg bg-surface-container-high text-sm font-bold text-on-surface hover:bg-surface-bright transition-colors border border-outline-variant/10"
          >
            Manage All Applications
          </button>
        </div>
      </div>

      {/* Bottom Row: Bar Chart */}
      <div className="glass-panel inner-glow rounded-xl p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-on-surface">Jobs Applied per Month</h4>
            <p className="text-sm text-on-surface-variant">{chartRange === 6 ? 'Last 6 months activity metrics' : 'Full year activity metrics'}</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={chartRange}
              onChange={(e) => setChartRange(Number(e.target.value))}
              className="bg-surface-container-lowest border-none text-xs rounded-lg py-1 px-3 text-on-surface-variant focus:ring-0 outline-none cursor-pointer"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Full Year</option>
            </select>
          </div>
        </div>
        <div className="h-64 w-full flex items-end justify-around px-4 pb-8 relative">
          <div className="absolute inset-0 flex flex-col justify-between py-8 px-4 pointer-events-none">
            <div className="w-full border-t border-outline-variant/5"></div>
            <div className="w-full border-t border-outline-variant/5"></div>
            <div className="w-full border-t border-outline-variant/5"></div>
          </div>
          {chartMonths.map((month, idx) => {
            const count = chartData[idx]
            const heightPercent = (count / maxCount) * 100
            const isCurrentMonth = month === chartMonths[chartMonths.length - 1]
            
            return (
              <div key={idx} className={`flex flex-col items-center justify-end gap-3 group cursor-pointer relative z-10 h-full ${chartRange === 12 ? 'w-10' : chartRange === 6 ? 'w-12' : 'w-20'}`}>
                <div 
                  className={`w-8 rounded-t-md transition-all duration-1000 ease-out ${isCurrentMonth ? 'bg-primary shadow-[0_0_20px_rgba(133,173,255,0.3)]' : 'bg-primary-container/20 group-hover:bg-primary-container'}`}
                  style={{ 
                    height: `${Math.max(heightPercent, 2)}%`,
                    transitionDelay: `${idx * 0.1}s`
                  }} // Minimum height for visibility
                ></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentMonth ? 'text-primary' : 'text-on-surface-variant'}`}>{month}</span>
                {/* Tooltip on hover */}
                <div className="absolute -top-8 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {count} Jobs
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, subtitle, icon, color }: any) {
  const colorMap: any = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    error: 'bg-error/10 text-error'
  }
  const accentMap: any = {
    primary: 'from-primary/0 via-primary/40 to-primary/0',
    secondary: 'from-secondary/0 via-secondary/40 to-secondary/0',
    tertiary: 'from-tertiary/0 via-tertiary/40 to-tertiary/0',
    error: 'from-error/0 via-error/40 to-error/0'
  }

  return (
    <div className="glass-panel inner-glow rounded-xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${color === 'primary' || color === 'tertiary' ? 'text-tertiary-dim' : 'text-on-surface-variant'}`}>{subtitle}</span>
      </div>
      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-bold tracking-tighter text-on-surface">{value}</h3>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${accentMap[color]} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    </div>
  )
}

function InterviewItem({ date, month, company, role, round, type, color, onClick, opacity = '' }: any) {
  const typeColorMap: any = {
    secondary: 'bg-secondary/10 text-secondary',
    primary: 'bg-primary/10 text-primary',
    tertiary: 'bg-tertiary/10 text-tertiary'
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-6 p-4 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high transition-colors cursor-pointer group ${opacity}`}
    >
      <div className="w-14 h-14 rounded-xl bg-surface-container-lowest flex flex-col items-center justify-center shrink-0 border border-outline-variant/10">
        <span className="text-[10px] font-bold uppercase text-on-surface-variant">{month}</span>
        <span className="text-xl font-bold text-on-surface">{date}</span>
      </div>
      <div className="flex-1">
        <h5 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">{role}</h5>
        <p className="text-sm text-on-surface-variant">{company} • {round}</p>
      </div>
      <div className="text-right">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${typeColorMap[color]}`}>{type}</span>
      </div>
      <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
    </div>
  )
}

function SubmissionItem({ company, role, time, statusColor }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
        <div>
          <p className="text-sm font-bold text-on-surface leading-none">{company}</p>
          <p className="text-[10px] text-on-surface-variant uppercase font-semibold">{role}</p>
        </div>
      </div>
      <p className="text-[10px] text-on-surface-variant font-bold">{time}</p>
    </div>
  )
}

export default Dashboard
