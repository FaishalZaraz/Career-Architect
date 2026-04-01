import React, { createContext, useContext, useState, ReactNode } from 'react'

type ViewMode = 'month' | 'week'

interface CalendarContextType {
  currentDate: Date
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  setCurrentDate: (date: Date) => void
  next: () => void
  prev: () => void
  today: () => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const next = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const nextWeek = new Date(currentDate)
      nextWeek.setDate(currentDate.getDate() + 7)
      setCurrentDate(nextWeek)
    }
  }

  const prev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const lastWeek = new Date(currentDate)
      lastWeek.setDate(currentDate.getDate() - 7)
      setCurrentDate(lastWeek)
    }
  }

  const today = () => {
    setCurrentDate(new Date())
  }

  return (
    <CalendarContext.Provider value={{ 
      currentDate, 
      viewMode, 
      setViewMode, 
      setCurrentDate, 
      next, 
      prev, 
      today 
    }}>
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}
