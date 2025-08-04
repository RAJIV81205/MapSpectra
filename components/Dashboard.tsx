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
    <div className="min-h-screen bg-white p-4 font-mono">
      {/* Toast notifications with neo brutal styling */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-red-400 text-black font-bold',
          duration: 4000,
        }}
      />
      
      {/* Main brutal header - straight, no rotation */}
      <div className="mb-6">
        <h1 className="text-5xl font-black text-black mb-2 uppercase tracking-tight font-mono">
          WEATHER BRUTAL
        </h1>
        <div className="w-32 h-2 bg-red-500"></div>
      </div>

      {/* Timeline Card - Brutal styling, straight */}
      <div className="mb-6 bg-cyan-400 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-6">
          <div className="bg-white border-4 border-black p-4 mb-4">
            <h2 className="text-2xl font-black uppercase text-black mb-0 font-mono">Timeline Controls</h2>
          </div>
          <TimelineSlider timeRange={timeRange} onTimeChange={setTimeRange} />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Map Card - Brutal styling, straight */}
        <div className="lg:col-span-3 bg-lime-300 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-6">
            <div className="bg-red-500 border-4 border-black p-4 mb-4">
              <h2 className="text-2xl font-black uppercase text-white font-mono">Interactive Map</h2>
            </div>
            <div className="bg-white border-4 border-black p-2 mb-4">
              <p className="text-black font-bold uppercase text-sm font-mono">Draw polygons to analyze weather data</p>
            </div>
            <div className="h-[500px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
        </div>

        {/* Sidebar Card - Brutal styling, straight */}
        <div className="bg-purple-400 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-6 h-full">
            <div className="bg-black border-4 border-white p-4 mb-4">
              <h2 className="text-2xl font-black uppercase text-white font-mono">Controls</h2>
            </div>
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

      {/* Polygon Grid - Brutal styling, straight */}
      <div className="bg-orange-400 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
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
