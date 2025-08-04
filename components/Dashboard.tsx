'use client'

import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { TimeRange, DataSource, PolygonData } from '../types'
import Map from './Map'
import TimelineSlider from './TimelineSlider'
import Sidebar from './Sidebar'
import PolygonGrid from './Polygon'

const Dashboard: React.FC = () => {
  // Initialize time range with current date
  const currentDate = new Date('2025-08-04T07:00:00')
  const [timeRange, setTimeRange] = useState<TimeRange>({
    mode: 'single',
    start: currentDate,
    end: currentDate,
    currentHour: 0
  })

  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'temperature',
      name: 'Temperature',
      field: 'temperature_2m',
      unit: '°C',
      isActive: true,
      thresholds: [
        { operator: '>=', value: 25, color: '#ff0000' },
        { operator: '>=', value: 15, color: '#ffaa00' },
        { operator: '<', value: 15, color: '#0000ff' }
      ]
    },
    {
      id: 'humidity',
      name: 'Humidity',
      field: 'relative_humidity_2m',
      unit: '%',
      isActive: false,
      thresholds: [
        { operator: '>=', value: 80, color: '#0066cc' },
        { operator: '>=', value: 50, color: '#88ccff' },
        { operator: '<', value: 50, color: '#ffcc00' }
      ]
    }
  ])

  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Toast notifications with dark mode support and limited toasts */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Global toast options
          className: '',
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
      
      {/* Add CSS variables for dark mode support */}
      <style jsx global>{`
        :root {
          --toast-bg: #ffffff;
          --toast-color: #1f2937;
          --toast-border: #e5e7eb;
        }
        
        [data-theme="dark"], .dark {
          --toast-bg: #374151;
          --toast-color: #f9fafb;
          --toast-border: #4b5563;
        }
        
        .dark .react-hot-toast div[role="status"] {
          background: var(--toast-bg) !important;
          color: var(--toast-color) !important;
          border: 1px solid var(--toast-border) !important;
        }
      `}</style>

      {/* Timeline Card - Moved to top */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Timeline Controls</h2>
        <TimelineSlider timeRange={timeRange} onTimeChange={setTimeRange} />
      </div>

      {/* Main Grid Layout - Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        {/* Map Card - Takes 3 columns on large screens */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Interactive Map</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Draw polygons to analyze weather data</p>
          </div>
          <div className="h-96 lg:h-[500px]">
            <Map
              timeRange={timeRange}
              dataSources={dataSources}
              polygons={polygons}
              setPolygons={setPolygons}
              selectedPolygon={selectedPolygon}
              setSelectedPolygon={setSelectedPolygon}
            />
          </div>
        </div>

        {/* Sidebar Card - Takes 1 column, fixed height without overflow */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-fit lg:h-[588px] overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Controls</h2>
          </div>
          <div className="h-[calc(100%-64px)] overflow-y-auto">
            <Sidebar
              dataSources={dataSources}
              setDataSources={setDataSources}
              polygons={polygons}
              setPolygons={setPolygons}
              selectedPolygon={selectedPolygon}
              setSelectedPolygon={setSelectedPolygon}
            />
          </div>
        </div>
      </div>

      {/* Polygon Grid - Under the map */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <PolygonGrid
          polygons={polygons}
          setPolygons={setPolygons}
          selectedPolygon={selectedPolygon}
          setSelectedPolygon={setSelectedPolygon}
          dataSources={dataSources}
        />
      </div>
    </div>
  )
}

export default Dashboard
