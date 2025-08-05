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
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const getClientX = (e: MouseEvent | TouchEvent): number => {
    if ('touches' in e) {
      return e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0
    }
    return e.clientX
  }

  const pixelToPosition = (pixel: number) => {
    const rect = sliderRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const percentage = Math.max(0, Math.min(1, pixel / rect.width))
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

  const handleStart = (e: React.MouseEvent | React.TouchEvent, target: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragTarget(target)
  }

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderRef.current) return

    e.preventDefault()
    const rect = sliderRef.current.getBoundingClientRect()
    const x = getClientX(e) - rect.left
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

  const handleEnd = useCallback(() => {
    setIsDragging(false)
    setDragTarget(null)
  }, [])

  const handleTrackClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging || !sliderRef.current) return

    e.preventDefault()
    const rect = sliderRef.current.getBoundingClientRect()
    const x = getClientX(e as any) - rect.left
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
      const handleMouseMove = (e: MouseEvent) => handleMove(e)
      const handleMouseUp = () => handleEnd()
      const handleTouchMove = (e: TouchEvent) => handleMove(e)
      const handleTouchEnd = () => handleEnd()

      if (isMobile) {
        document.addEventListener('touchmove', handleTouchMove, { passive: false })
        document.addEventListener('touchend', handleTouchEnd)
      } else {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }

      return () => {
        if (isMobile) {
          document.removeEventListener('touchmove', handleTouchMove)
          document.removeEventListener('touchend', handleTouchEnd)
        } else {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }
  }, [isDragging, handleMove, handleEnd, isMobile])

  const currentPosition = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  const startPosition = dateToPosition(timeRange.start)
  const endPosition = dateToPosition(timeRange.end)

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600 font-medium">Time Mode:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onTimeChange({ ...timeRange, mode: 'single' })}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                timeRange.mode === 'single'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Single Point
            </button>
            <button
              onClick={() => onTimeChange({ ...timeRange, mode: 'range' })}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                timeRange.mode === 'range'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Time Range
            </button>
          </div>
        </div>

        {/* Selected Time Display */}
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {timeRange.mode === 'single'
              ? formatDate(timeRange.start)
              : `${formatDate(timeRange.start)} — ${formatDate(timeRange.end)}`}
          </div>
          {timeRange.mode === 'range' && (
            <div className="text-xs text-gray-500">
              {Math.round((endPosition - startPosition) / 24 * 10) / 10} days selected
            </div>
          )}
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="relative h-12 bg-gray-100 rounded-lg cursor-pointer touch-none"
          onClick={handleTrackClick}
          onTouchStart={handleTrackClick}
        >
          {/* Selected Range Background */}
          {timeRange.mode === 'range' && (
            <div
              className="absolute top-0 h-full bg-blue-200 rounded-lg transition-all duration-200"
              style={{
                left: `${(startPosition / totalHours) * 100}%`,
                width: `${((endPosition - startPosition) / totalHours) * 100}%`
              }}
            />
          )}

          {/* Current Time Indicator */}
          <div
            className="absolute top-1 bottom-1 w-0.5 bg-red-400 rounded-full"
            style={{
              left: `${(currentPosition / totalHours) * 100}%`
            }}
          />

          {/* Slider handles */}
          {timeRange.mode === 'single' ? (
            <div
              className="absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform touch-manipulation"
              style={{
                left: `calc(${(startPosition / totalHours) * 100}% - 12px)`
              }}
              onMouseDown={(e) => handleStart(e, 'single')}
              onTouchStart={(e) => handleStart(e, 'single')}
            />
          ) : (
            <>
              {/* Start handle */}
              <div
                className="absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform touch-manipulation"
                style={{
                  left: `calc(${(startPosition / totalHours) * 100}% - 12px)`
                }}
                onMouseDown={(e) => handleStart(e, 'start')}
                onTouchStart={(e) => handleStart(e, 'start')}
              />
              {/* End handle */}
              <div
                className="absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full transform -translate-y-1/2 cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform touch-manipulation"
                style={{
                  left: `calc(${(endPosition / totalHours) * 100}% - 12px)`
                }}
                onMouseDown={(e) => handleStart(e, 'end')}
                onTouchStart={(e) => handleStart(e, 'end')}
              />
            </>
          )}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {Array.from({ length: 5 }, (_, i) => {
            const dayOffset = (i * 7.5)
            const date = new Date(startDate)
            date.setDate(date.getDate() + dayOffset)
            return (
              <div key={i}>
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
