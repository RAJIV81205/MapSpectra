'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { TimeRange } from "@/types"

interface TimelineSliderProps {
  timeRange: TimeRange
  onTimeChange: (timeRange: TimeRange) => void
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({ timeRange, onTimeChange }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Calculate 30-day range (15 days before and after current date)
  const currentDate = new Date('2025-08-04T07:00:00')
  const startDate = new Date(currentDate)
  startDate.setDate(startDate.getDate() - 15)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(currentDate)
  endDate.setDate(endDate.getDate() + 15)
  endDate.setHours(23, 59, 59, 999)
  
  const totalHours = 30 * 24

  const positionToDate = (hourPosition: number) => {
    const date = new Date(startDate)
    date.setHours(date.getHours() + hourPosition)
    return date
  }

  const dateToPosition = (date: Date) => {
    const diffMs = date.getTime() - startDate.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60))
  }

  const pixelToPosition = (pixel: number) => {
    const rect = sliderRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const percentage = pixel / rect.width
    return Math.round(percentage * totalHours)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const handleMouseDown = (e: React.MouseEvent, target: string) => {
    e.preventDefault()
    setIsDragging(true)
    setDragTarget(target)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newPosition = Math.max(0, Math.min(totalHours - 1, pixelToPosition(x)))
    const newDate = positionToDate(newPosition)
    
    if (timeRange.mode === 'single') {
      onTimeChange({
        ...timeRange,
        start: newDate,
        end: newDate,
        currentHour: newPosition
      })
    } else {
      if (dragTarget === 'start') {
        const endPosition = dateToPosition(timeRange.end)
        const validPosition = Math.min(newPosition, endPosition - 1)
        onTimeChange({
          ...timeRange,
          start: positionToDate(validPosition)
        })
      } else if (dragTarget === 'end') {
        const startPosition = dateToPosition(timeRange.start)
        const validPosition = Math.max(newPosition, startPosition + 1)
        onTimeChange({
          ...timeRange,
          end: positionToDate(validPosition)
        })
      }
    }
  }, [isDragging, dragTarget, timeRange, totalHours, onTimeChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragTarget(null)
  }, [])

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging || !sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newPosition = Math.max(0, Math.min(totalHours - 1, pixelToPosition(x)))
    const newDate = positionToDate(newPosition)
    
    if (timeRange.mode === 'single') {
      onTimeChange({
        ...timeRange,
        start: newDate,
        end: newDate,
        currentHour: newPosition
      })
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const currentPosition = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  const startPosition = dateToPosition(timeRange.start)
  const endPosition = dateToPosition(timeRange.end)

  return (
    <div className="w-full p-6">
      {/* Mode Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              timeRange.mode === 'single' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => onTimeChange({ ...timeRange, mode: 'single' })}
          >
            Single Point
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              timeRange.mode === 'range' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => onTimeChange({ ...timeRange, mode: 'range' })}
          >
            Time Range
          </button>
        </div>
      </div>

      {/* Selected Time Display */}
      <div className="mb-6 text-center">
        <div className="text-xl font-semibold text-gray-900 dark:text-white">
          {timeRange.mode === 'single'
            ? formatDate(timeRange.start)
            : `${formatDate(timeRange.start)} — ${formatDate(timeRange.end)}`
          }
        </div>
        {timeRange.mode === 'range' && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((endPosition - startPosition) / 24 * 10) / 10} days selected
          </div>
        )}
      </div>

      {/* Timeline Slider */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Selected Range Background */}
          {timeRange.mode === 'range' && (
            <div
              className="absolute h-full bg-blue-500 rounded-full"
              style={{
                left: `${(startPosition / totalHours) * 100}%`,
                width: `${((endPosition - startPosition) / totalHours) * 100}%`,
              }}
            />
          )}
          
          {/* Current Time Indicator */}
          <div
            className="absolute w-0.5 h-6 bg-red-500 rounded-full transform -translate-y-2"
            style={{ left: `${(currentPosition / totalHours) * 100}%` }}
          />
          
          {/* Slider Handles */}
          {timeRange.mode === 'single' ? (
            <div
              className={`absolute w-6 h-6 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-2 -translate-x-3 transition-all ${
                isDragging ? 'scale-110' : 'hover:scale-105'
              } cursor-grab active:cursor-grabbing`}
              style={{ left: `${(startPosition / totalHours) * 100}%` }}
              onMouseDown={(e) => handleMouseDown(e, 'single')}
            />
          ) : (
            <>
              <div
                className={`absolute w-6 h-6 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-2 -translate-x-3 transition-all ${
                  isDragging && dragTarget === 'start' ? 'scale-110' : 'hover:scale-105'
                } cursor-grab active:cursor-grabbing`}
                style={{ left: `${(startPosition / totalHours) * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'start')}
              />
              <div
                className={`absolute w-6 h-6 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-2 -translate-x-3 transition-all ${
                  isDragging && dragTarget === 'end' ? 'scale-110' : 'hover:scale-105'
                } cursor-grab active:cursor-grabbing`}
                style={{ left: `${(endPosition / totalHours) * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'end')}
              />
            </>
          )}
        </div>

        {/* Time Labels */}
        <div className="mt-4 relative h-6">
          {Array.from({ length: 5 }, (_, i) => {
            const dayOffset = (i * 7.5)
            const position = (dayOffset / 30) * 100
            const date = new Date(startDate)
            date.setDate(date.getDate() + dayOffset)
            
            return (
              <div
                key={i}
                className="absolute text-xs text-gray-500 dark:text-gray-400 transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TimelineSlider
