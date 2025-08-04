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
    <div className="min-h-screen bg-yellow-300 p-4 font-mono">
      {/* Toast notifications with neo brutal styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#000',
            color: '#fff',
            border: '3px solid #fff',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '16px',
            textTransform: 'uppercase'
          }
        }}
      />

      {/* Main brutal header - straight, no rotation */}
      <div className="text-center mb-6">
        <h1 className="text-6xl font-black text-black bg-white border-4 border-black inline-block px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform-none">
          MAP SPECTRA
        </h1>
      </div>

      {/* Timeline Card - Brutal styling, straight */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
        <div className="bg-black text-white px-4 py-2 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">Timeline Controls</h2>
        </div>
        <div className="p-4">
          <TimelineSlider timeRange={timeRange} onTimeChange={setTimeRange} />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Card - Brutal styling, straight */}
        <div className="lg:col-span-2 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white px-4 py-2 border-b-4 border-black">
            <h2 className="text-xl font-black uppercase">Interactive Map</h2>
            <p className="text-sm font-bold">Draw polygons to analyze weather data</p>
          </div>
          <div className="relative ">
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

        {/* Sidebar Card - Brutal styling, straight */}
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white px-4 py-2 border-b-4 border-black">
            <h2 className="text-xl font-black uppercase">Controls</h2>
          </div>
          <div className="h-120 overflow-y-auto">
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
      <div className="mt-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
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
