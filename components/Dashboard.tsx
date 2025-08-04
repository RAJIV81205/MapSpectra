'use client'

import React, { useState } from 'react'
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
    },
    {
      id: 'precipitation',
      name: 'Precipitation',
      field: 'precipitation',
      unit: 'mm',
      isActive: false,
      thresholds: [
        { operator: '>=', value: 5, color: '#0066cc' },
        { operator: '>=', value: 1, color: '#88ccff' },
        { operator: '<', value: 1, color: '#ffffff' }
      ]
    }
  ])

  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(null)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      

      {/* Timeline Card - Moved to top */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          <div className="p-4">
            <TimelineSlider
              timeRange={timeRange}
              onTimeChange={setTimeRange}
            />
          </div>
        </div>
      </div>

      {/* Main Grid Layout - Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Card - Takes 3 columns on large screens */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Interactive Map
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Draw polygons to analyze weather data
              </p>
            </div>
            <div className="h-96">
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
          
          {/* Polygon Grid - Under the map */}
          <div className="mt-6">
            <PolygonGrid
              polygons={polygons}
              setPolygons={setPolygons}
              selectedPolygon={selectedPolygon}
              setSelectedPolygon={setSelectedPolygon}
              dataSources={dataSources}
            />
          </div>
        </div>

        {/* Sidebar Card - Takes 1 column, fixed height without overflow */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Controls
              </h2>
            </div>
            <div className="p-4">
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
      </div>
    </div>
  )
}

export default Dashboard