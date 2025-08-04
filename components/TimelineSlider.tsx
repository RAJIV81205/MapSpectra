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
    <div className="space-y-4">
      {/* Mode Toggle - Brutal buttons, straight */}
      <div className="flex gap-4">
        <button
          className={`px-6 py-3 border-4 border-black font-black text-lg transition-all ${
            timeRange.mode === 'single'
              ? 'bg-yellow-400 text-gray-900  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform-none'
              : 'bg-white text-gray-600  hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
          }`}
          onClick={() => onTimeChange({ ...timeRange, mode: 'single' })}
        >
          Single Point
        </button>
        <button
          className={`px-6 py-3 border-4 border-black font-black text-lg transition-all ${
            timeRange.mode === 'range'
              ? 'bg-yellow-400 text-gray-900  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform-none'
              : 'bg-white text-gray-600  hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
          }`}
          onClick={() => onTimeChange({ ...timeRange, mode: 'range' })}
        >
          Time Range
        </button>
      </div>

      {/* Selected Time Display - Brutal box, straight */}
      <div className="bg-black text-white px-4 py-3 border-4 border-white font-black text-lg">
        {timeRange.mode === 'single'
          ? formatDate(timeRange.start)
          : `${formatDate(timeRange.start)} — ${formatDate(timeRange.end)}`}
        {timeRange.mode === 'range' && (
          <div className="text-sm font-bold mt-1">
            {Math.round((endPosition - startPosition) / 24 * 10) / 10} days selected
          </div>
        )}
      </div>

      {/* Timeline Slider - Harsh geometric styling, straight */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="h-12 bg-gray-200 border-4 border-black cursor-pointer relative"
          onClick={handleTrackClick}
        >
          {/* Selected Range Background */}
          {timeRange.mode === 'range' && (
            <div
              className="absolute top-0 h-full bg-yellow-400 border-2 border-black"
              style={{
                left: `${(startPosition / totalHours) * 100}%`,
                width: `${((endPosition - startPosition) / totalHours) * 100}%`,
              }}
            />
          )}

          {/* Current Time Indicator */}
          <div
            className="absolute top-0 w-1 h-full bg-red-600 border border-black z-10"
            style={{ left: `${(currentPosition / totalHours) * 100}%` }}
          />

          {/* Slider handles - Brutal squares, straight */}
          {timeRange.mode === 'single' ? (
            <div
              className="absolute top-1/2 w-6 h-6 bg-black border-2 border-white cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 z-20"
              style={{ left: `${(startPosition / totalHours) * 100}%` }}
              onMouseDown={(e) => handleMouseDown(e, 'single')}
            />
          ) : (
            <>
              <div
                className="absolute top-1/2 w-6 h-6 bg-green-600 border-2 border-white cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 z-20"
                style={{ left: `${(startPosition / totalHours) * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'start')}
              />
              <div
                className="absolute top-1/2 w-6 h-6 bg-red-600 border-2 border-white cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 z-20"
                style={{ left: `${(endPosition / totalHours) * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'end')}
              />
            </>
          )}
        </div>

        {/* Time Labels - Brutal styling, straight */}
        <div className="flex justify-between mt-2 text-xs font-black text-gray-900">
          {Array.from({ length: 5 }, (_, i) => {
            const dayOffset = (i * 7.5)
            const date = new Date(startDate)
            date.setDate(date.getDate() + dayOffset)
            return (
              <div key={i} className="text-center">
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
