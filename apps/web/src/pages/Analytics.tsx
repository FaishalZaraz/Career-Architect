import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const Analytics = () => {
  const navigate = useNavigate()
  const [period, setPeriod] = useState(12)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary')
      return res.data
    }
  })
  
  const { data: activity } = useQuery({
    queryKey: ['analytics-activity', period],
    queryFn: async () => {
      const res = await api.get(`/analytics/activity?range=${period}`)
      return res.data
    }
  })

  const handleExport = () => {
    if (!summary || !activity) {
      alert('Data not ready for export.')
      return
    }

    const headers = ['Metric', 'Value']
    const statsData = [
      ['Total Applications', summary.totalApplications],
      ['Interview Rate', `${summary.interviewRate}%`],
      ['Offers Count', summary.offersCount],
      ['Active Opportunities', summary.activeOpportunitiesCount],
      ['', '']
    ]

    const activityHeaders = ['Month', 'Total Applications', 'Source Breakdowns']
    const activityRows = sortedMonths.map(m => [
      m.month,
      m.total,
      Object.entries(m.sources).map(([s, c]) => `${s}: ${c}`).join(' | ')
    ])

    const csvContent = [
      headers.join(','),
      ...statsData.map(r => r.join(',')),
      activityHeaders.join(','),
      ...activityRows.map(r => r.map(v => typeof v === 'string' ? `"${v}"` : v).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Career_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { data: highImpact } = useQuery({
    queryKey: ['analytics-high-impact'],
    queryFn: async () => {
      const res = await api.get('/analytics/high-impact')
      return res.data
    }
  })

  // Transform activity data for the line chart (Ensure all months in range are shown)
  const sortedMonths: any[] = []
  const monthMap = new Map()
  
  // Generate the list of months for the selected period
  const allMonthsInRange = []
  const monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date()
  for (let i = period - 1; i >= 0; i--) {
    const monthDate = new Date(d.getFullYear(), d.getMonth() - i, 1)
    const monthName = monthsAbbr[monthDate.getMonth()]
    allMonthsInRange.push(monthName)
    const monthObj = { month: monthName, total: 0, sources: {} }
    monthMap.set(monthName, monthObj)
    sortedMonths.push(monthObj)
  }

  activity?.forEach((curr: any) => {
    if (monthMap.has(curr.month)) {
      const monthObj = monthMap.get(curr.month)
      monthObj.total += Number(curr.count || 0)
      if (curr.source) {
        monthObj.sources[curr.source] = (monthObj.sources[curr.source] || 0) + Number(curr.count || 0)
      }
    }
  })

  const maxVal = Math.max(...sortedMonths.map(m => m.total), 1)

  // Donut Chart Calculation
  const totalApps = summary?.totalApplications || 0
  let cumulativePercent = 0
  const donutSegments = summary?.sourceDistribution?.map((s: any, i: number) => {
    const percent = (s.count / (totalApps || 1)) * 100
    const start = cumulativePercent
    cumulativePercent += percent
    return { ...s, start, percent, color: i === 0 ? '#85adff' : i === 1 ? '#b285ff' : '#85ffcc' }
  }) || []

  const getX = (i: number, len: number) => {
    if (len <= 1) return 500
    // Add 50px horizontal padding within the 1000px viewBox
    const val = 50 + (i / (len - 1)) * 900
    return isNaN(val) ? 500 : val
  }

  const getY = (total: number, max: number) => {
    const safeMax = max || 1
    // Keep bars/points between 60 and 180 within the 200px viewBox (40px top padding)
    const val = 180 - ((total / safeMax) * 120)
    return isNaN(val) ? 180 : val
  }

  // Calculate trends (mocking trend calculation based on current vs previous if we had it, but for now just showing real values)
  
  return (
    <div className="pt-4 pb-12 space-y-8">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Performance Insights</h2>
          <p className="text-on-surface-variant mt-1">Reviewing your career trajectory and application efficiency.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <div 
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="bg-surface-container-high px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-outline-variant/10 cursor-pointer hover:bg-surface-bright transition-colors select-none"
            >
              <span className="text-on-surface-variant">Period:</span>
              <span>Last {period} Months</span>
              <span className={`material-symbols-outlined text-sm text-primary transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            
            {showPeriodDropdown && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-surface-container-highest border border-outline-variant/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {[3, 6, 12].map((m) => (
                  <div 
                    key={m}
                    onClick={() => {
                      setPeriod(m)
                      setShowPeriodDropdown(false)
                    }}
                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${period === m ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
                  >
                    Last {m} Months
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleExport}
            className="bg-surface-bright/80 hover:bg-surface-bright px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-outline-variant/20 shadow-sm active:scale-95"
          >
            Export Report
          </button>
        </div>
      </section>

      {/* Key Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsStatCard
          label="Total Applications"
          value={summary?.totalApplications || 0}
          trend="Total"
          progress={100}
          color="primary"
          isStable
        />
        <AnalyticsStatCard
          label="Interview Rate"
          value={`${summary?.interviewRate || 0}%`}
          trend="Conversion"
          progress={summary?.interviewRate || 0}
          color="secondary"
          isStable
        />
        <AnalyticsStatCard
          label="Success Rate"
          value={`${((summary?.offersCount || 0) / (summary?.totalApplications || 1) * 100).toFixed(1)}%`}
          trend="Final"
          progress={(summary?.offersCount || 0) / (summary?.totalApplications || 1) * 100}
          color="tertiary"
          isStable
        />
        <AnalyticsStatCard
          label="Offers Pending"
          value={summary?.offersCount || 0}
          trend="Pipeline"
          progress={summary?.offersCount ? 100 : 0}
          color="primary-container"
          isStable
        />
      </section>

      {/* Line Chart Section */}
      <section className="grid grid-cols-1 gap-6">
        <div className="bg-surface-container-low rounded-2xl p-8 shadow-xl border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Application Activity</h3>
              <p className="text-sm text-on-surface-variant">Tracking monthly progression over the last year</p>
            </div>
          </div>
          
          <div className="h-64 w-full relative">
            <div className="absolute inset-0 flex items-end justify-between px-2 border-b border-l border-outline-variant/20">
              {sortedMonths.length > 0 && (
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 1000 200`}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#85adff" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#85adff" stopOpacity="0" />
                    </linearGradient>
                    <style>{`
                      .animate-draw {
                        stroke-dasharray: 2000;
                        stroke-dashoffset: 2000;
                        animation: draw 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                      }
                      @keyframes draw {
                        to { stroke-dashoffset: 0; }
                      }
                      .stagger-point {
                        opacity: 0;
                        animation: fadeInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                      }
                      @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0); transform-origin: center; }
                        to { opacity: 1; transform: scale(1); transform-origin: center; }
                      }
                    `}</style>
                  </defs>
                  {/* Total applications line */}
                  <path 
                    d={`M ${sortedMonths.map((d: any, i: number) => {
                      return `${getX(i, sortedMonths.length)},${getY(d.total, maxVal)}`
                    }).join(' L ')}`} 
                    fill="none" 
                    stroke="#85adff" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw"
                  />
                  <path 
                    d={`M ${getX(0, sortedMonths.length)},200 L ${sortedMonths.map((d: any, i: number) => {
                      return `${getX(i, sortedMonths.length)},${getY(d.total, maxVal)}`
                    }).join(' L ')} L ${getX(sortedMonths.length - 1, sortedMonths.length)},200 Z`} 
                    fill="url(#lineGrad)" 
                  />
                  {/* Individual circles for data points and labels */}
                  {sortedMonths.map((d: any, i: number) => {
                    const cx = getX(i, sortedMonths.length)
                    const cy = getY(d.total, maxVal)
                    return (
                      <g key={`${i}-${period}`} className="stagger-point" style={{ animationDelay: `${i * 0.1 + 0.5}s` }}>
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r="6" 
                          fill="#85adff"
                          className="drop-shadow-lg"
                        />
                        <text
                          x={cx}
                          y={cy - 15}
                          textAnchor="middle"
                          fill="#85adff"
                          fontSize="10"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          {d.total}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-[1px] bg-on-surface"></div>)}
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4 px-[50px] text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            {sortedMonths.map((m: any) => <span key={m.month} className="w-0 flex justify-center overflow-visible">{m.month}</span>)}
          </div>
        </div>
      </section>

      {/* Split Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface mb-6">Application Sources</h3>
          <div className="flex flex-col sm:flex-row items-center gap-12">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSegments.length > 0 && totalApps > 0 ? donutSegments.map((s: any) => (
                  <circle
                    key={s.source}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth="12"
                    strokeDasharray={`${s.percent} 100`}
                    strokeDashoffset={-s.start}
                    strokeLinecap="round"
                    pathLength="100"
                    className="transition-all duration-1000 ease-out"
                  />
                )) : (
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-on-surface">{totalApps}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full space-y-4">
              {summary?.sourceDistribution?.length > 0 ? (
                summary.sourceDistribution.map((s: any, i: number) => (
                  <SourceItem 
                    key={s.source} 
                    color={i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-tertiary'} 
                    label={s.source || 'Direct'} 
                    value={`${((s.count / summary.totalApplications) * 100).toFixed(0)}%`} 
                  />
                ))
              ) : (
                <p className="text-xs text-on-surface-variant italic">No source data yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-on-surface">Recent Target Companies</h3>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Pipeline</span>
          </div>
          <div className="space-y-6">
            {summary?.activeOpportunitiesCount > 0 ? (
              <p className="text-sm text-on-surface-variant">You have {summary.activeOpportunitiesCount} active opportunities in your pipeline.</p>
            ) : (
              <p className="text-sm text-on-surface-variant italic">No active opportunities found.</p>
            )}
            <div className="pt-4 flex flex-col gap-3">
               <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/40">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Interview Momentum</p>
                    <p className="text-[10px] text-on-surface-variant">{summary?.interviewsCount || 0} scheduled interviews</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/40">
                  <span className="material-symbols-outlined text-tertiary">celebration</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Offer Potential</p>
                    <p className="text-[10px] text-on-surface-variant">{summary?.offersCount || 0} offers pending</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities Table Section */}
      <section className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
        <div className="p-6 flex justify-between items-center bg-surface-container-high/30">
          <h3 className="text-lg font-bold text-on-surface">High-Impact Opportunities</h3>
          <button 
            onClick={() => navigate('/applications')}
            className="text-primary text-sm font-bold hover:underline transition-all"
          >
            View All Pipeline
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold border-b border-outline-variant/10">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sentiment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {highImpact && highImpact.length > 0 ? highImpact.map((job: any) => (
                <OpportunityRow
                  key={job.id}
                  icon={job.icon}
                  company={job.company}
                  role={job.role}
                  status={job.status}
                  statusColor={job.status === 'Offer' ? 'tertiary' : job.status === 'Interview' ? 'secondary' : 'primary'}
                  sentiment={job.sentiment}
                  sentimentIcon={job.sentimentIcon}
                  sentimentColor={job.sentimentColor}
                />
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant italic">
                    No high-impact opportunities in your pipeline yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}

function AnalyticsStatCard({ label, value, trend, progress, color, isStable }: any) {
  const colorMap: any = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    'primary-container': 'bg-primary-container'
  }
  return (
    <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-outline-variant/10 hover:border-primary/20 transition-all">
      <div className={`absolute top-0 right-0 w-32 h-32 ${colorMap[color]}/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity opacity-0 group-hover:opacity-100`}></div>
      <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-4xl font-bold tracking-tighter text-on-surface">{value}</span>
        <span className={`${isStable ? 'text-on-surface-variant' : 'text-tertiary'} text-xs font-bold`}>{trend}</span>
      </div>
      <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{label}</span>
    </div>
  )
}

function SourceItem({ color, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-sm font-medium text-on-surface">{label}</span>
      </div>
      <span className="text-sm font-bold text-on-surface">{value}</span>
    </div>
  )
}

function ResponseBar({ company, days, percentage }: any) {
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-on-surface group-hover:text-primary transition-colors">{company}</span>
        <span className="text-on-surface-variant">{days} Days</span>
      </div>
      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out group-hover:bg-primary-fixed" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}

function OpportunityRow({ icon, company, role, status, statusColor, sentiment, sentimentIcon, sentimentColor }: any) {
  const statusColors: any = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary'
  }
  const sentimentColors: any = {
    tertiary: 'text-tertiary',
    primary: 'text-primary'
  }

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-sm">{icon}</span>
          </div>
          <span className="font-bold text-sm text-on-surface">{company}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{role}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded ${statusColors[statusColor]} text-[10px] font-bold uppercase tracking-widest`}>{status}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <span className={`material-symbols-outlined ${sentimentColors[sentimentColor]} text-lg`} style={{ fontVariationSettings: "'FILL' 1" }}>{sentimentIcon}</span>
          <span className={`text-xs font-medium ${sentimentColors[sentimentColor]}`}>{sentiment}</span>
        </div>
      </td>
    </tr>
  )
}

export default Analytics
