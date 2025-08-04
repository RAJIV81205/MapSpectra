"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';

const TimelineSlider = () => {
  const [mode, setMode] = useState('single'); // 'single' or 'range'
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  
  // Get current date and calculate 30-day range
  const currentDate = new Date('2025-08-04T07:00:00');
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 15);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(currentDate);
  endDate.setDate(endDate.getDate() + 15);
  endDate.setHours(23, 59, 59, 999);
  
  const totalHours = 30 * 24; // 720 hours
  
  // Initialize positions
  const getInitialPosition = () => {
    const diffMs = currentDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  };
  
  const [singlePosition, setSinglePosition] = useState(getInitialPosition());
  const [rangeStart, setRangeStart] = useState(getInitialPosition() - 24);
  const [rangeEnd, setRangeEnd] = useState(getInitialPosition() + 24);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Convert position to date
  const positionToDate = (position: number) => {
    const date = new Date(startDate);
    date.setHours(date.getHours() + position);
    return date;
  };
  
  // Convert pixel to position
  const pixelToPosition = (pixel: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const percentage = pixel / rect.width;
    return Math.round(percentage * totalHours);
  };
  
  // Convert position to pixel
  const positionToPixel = (position: number) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    return (position / totalHours) * rect.width;
  };
  
  // Format date for display
  const formatDate = (date: Date, compact = false) => {
    if (compact) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTarget(target);
  };
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = Math.max(0, Math.min(totalHours - 1, pixelToPosition(x)));
    
    if (mode === 'single') {
      setSinglePosition(newPosition);
    } else {
      if (dragTarget === 'start') {
        setRangeStart(Math.min(newPosition, rangeEnd - 1));
      } else if (dragTarget === 'end') {
        setRangeEnd(Math.max(newPosition, rangeStart + 1));
      }
    }
  }, [isDragging, dragTarget, mode, rangeEnd, rangeStart, totalHours]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget(null);
  }, []);
  
  // Handle track click
  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = Math.max(0, Math.min(totalHours - 1, pixelToPosition(x)));
    
    if (mode === 'single') {
      setSinglePosition(newPosition);
    } else {
      // For range mode, move the closest handle
      const distToStart = Math.abs(newPosition - rangeStart);
      const distToEnd = Math.abs(newPosition - rangeEnd);
      
      if (distToStart < distToEnd) {
        setRangeStart(Math.min(newPosition, rangeEnd - 1));
      } else {
        setRangeEnd(Math.max(newPosition, rangeStart + 1));
      }
    }
  };
  
  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Generate day markers
  const generateDayMarkers = () => {
    const markers = [];
    for (let day = 0; day <= 30; day++) {
      const position = (day / 30) * 100;
      const isWeekend = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000).getDay() % 6 === 0;
      markers.push(
        <div
          key={day}
          className={`absolute w-px h-2 ${isWeekend ? 'bg-gray-500' : 'bg-gray-600'} bottom-0`}
          style={{ left: `${position}%` }}
        />
      );
    }
    return markers;
  };
  
  // Generate time labels
  const generateTimeLabels = () => {
    const labels = [];
    for (let day = 0; day <= 30; day += 7) { // Every week
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      const position = (day / 30) * 100;
      
      labels.push(
        <div
          key={day}
          className="absolute text-xs text-gray-400 transform -translate-x-1/2 font-mono"
          style={{ left: `${position}%` }}
        >
          {formatDate(date, true)}
        </div>
      );
    }
    return labels;
  };
  
  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-900 text-white">
      {/* Mode Toggle */}
      <div className="mb-8 flex justify-center">
        <div className="bg-gray-800 p-0.5 rounded-full">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'single' 
                ? 'bg-gray-700 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('single')}
          >
            Single
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'range' 
                ? 'bg-gray-700 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setMode('range')}
          >
            Range
          </button>
        </div>
      </div>

      {/* Selected Time Display */}
      <div className="mb-8 text-center">
        <div className="text-2xl font-light text-white tracking-wide">
          {mode === 'single'
            ? formatDate(positionToDate(singlePosition))
            : `${formatDate(positionToDate(rangeStart))} — ${formatDate(positionToDate(rangeEnd))}`
          }
        </div>
        {mode === 'range' && (
          <div className="text-sm text-gray-400 mt-1">
            {Math.round((rangeEnd - rangeStart) / 24 * 10) / 10} days
          </div>
        )}
      </div>

      {/* Timeline Slider */}
      <div className="relative px-4">
        {/* Timeline Track */}
        <div
          ref={sliderRef}
          className="relative h-1 bg-gray-700 rounded-full cursor-pointer select-none"
          onClick={handleTrackClick}
        >
          {/* Selected Range Background */}
          {mode === 'range' && (
            <div
              className="absolute h-full bg-blue-500 rounded-full"
              style={{
                left: `${(rangeStart / totalHours) * 100}%`,
                width: `${((rangeEnd - rangeStart) / totalHours) * 100}%`,
              }}
            />
          )}
          
          {/* Single Selection Indicator */}
          {mode === 'single' && (
            <div
              className="absolute h-full bg-blue-500 rounded-full"
              style={{
                left: `${(singlePosition / totalHours) * 100}%`,
                width: '2px',
                marginLeft: '-1px'
              }}
            />
          )}
          
          {/* Current Time Indicator */}
          <div
            className="absolute w-0.5 h-4 bg-red-400 rounded-full transform -translate-y-1/2 top-1/2"
            style={{ left: `${(getInitialPosition() / totalHours) * 100}%` }}
          />
          
          {/* Slider Handles */}
          {mode === 'single' ? (
            <div
              className={`absolute w-5 h-5 bg-gray-800 border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-1/2 top-1/2 transition-all duration-150 ${
                isDragging ? 'cursor-grabbing scale-110 shadow-xl' : 'cursor-grab hover:scale-105'
              }`}
              style={{ left: `${(singlePosition / totalHours) * 100}%`, marginLeft: '-10px' }}
              onMouseDown={(e) => handleMouseDown(e, 'single')}
            />
          ) : (
            <>
              <div
                className={`absolute w-5 h-5 bg-gray-800 border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-1/2 top-1/2 transition-all duration-150 ${
                  isDragging && dragTarget === 'start' ? 'cursor-grabbing scale-110 shadow-xl' : 'cursor-grab hover:scale-105'
                }`}
                style={{ left: `${(rangeStart / totalHours) * 100}%`, marginLeft: '-10px' }}
                onMouseDown={(e) => handleMouseDown(e, 'start')}
              />
              <div
                className={`absolute w-5 h-5 bg-gray-800 border-2 border-blue-500 rounded-full shadow-lg transform -translate-y-1/2 top-1/2 transition-all duration-150 ${
                  isDragging && dragTarget === 'end' ? 'cursor-grabbing scale-110 shadow-xl' : 'cursor-grab hover:scale-105'
                }`}
                style={{ left: `${(rangeEnd / totalHours) * 100}%`, marginLeft: '-10px' }}
                onMouseDown={(e) => handleMouseDown(e, 'end')}
              />
            </>
          )}
        </div>

        {/* Day Markers */}
        <div className="absolute inset-0 pointer-events-none mt-1">
          {generateDayMarkers()}
        </div>

        {/* Time Labels */}
        <div className="mt-4 relative h-6">
          {generateTimeLabels()}
        </div>
      </div>

      {/* Minimal Info Display */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-4 px-6 py-3 bg-gray-800 rounded-full text-sm text-gray-300">
          {mode === 'single' ? (
            <span>Hour {singlePosition} of {totalHours}</span>
          ) : (
            <span>{rangeEnd - rangeStart}h selected</span>
          )}
          <div className="w-px h-4 bg-gray-600" />
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            Now
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;