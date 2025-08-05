'use client'

import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { TimeRange, DataSource, PolygonData } from '../types'
import Map from './Map'
import TimelineSlider from './TimelineSlider'
import Sidebar from './Sidebar'
import PolygonGrid from './Polygon'

const Dashboard: React.FC = () => {
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
        { operator: '>=', value: 25, color: '#ef4444' },
        { operator: '>=', value: 15, color: '#f59e0b' },
        { operator: '<', value: 15, color: '#3b82f6' }
      ]
    },
    {
      id: 'humidity',
      name: 'Humidity',
      field: 'relative_humidity_2m',
      unit: '%',
      isActive: false,
      thresholds: [
        { operator: '>=', value: 80, color: '#0ea5e9' },
        { operator: '>=', value: 50, color: '#06b6d4' },
        { operator: '<', value: 50, color: '#eab308' }
      ]
    }
  ])

  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(null)

  useEffect(() => {
    // Initialize tour
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#weather-map-box',
          popover: {
            title: 'Weather Map',
            description: 'This is your main map interface. Use the drawing tools to create analysis regions.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#timeline-box',
          popover: {
            title: 'Timeline Control',
            description: 'Select specific times or date ranges for weather analysis. Switch between single point and range modes.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#sidebar-box',
          popover: {
            title: 'Data Sources',
            description: 'Choose between Temperature and Humidity data. Customize color mapping rules for visualization.',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '#polygon-box',
          popover: {
            title: 'Region Analysis',
            description: 'View and manage your drawn regions. Click on regions to see detailed weather data.',
            side: 'top',
            align: 'center'
          }
        }
      ]
    })

    // Auto-start tour on first visit
    const hasSeenTour = localStorage.getItem('weather-app-tour')
    if (!hasSeenTour) {
      setTimeout(() => {
        driverObj.drive()
        localStorage.setItem('weather-app-tour', 'true')
      }, 1000)
    }

    // Add global help button
    const helpButton = document.createElement('button')
    helpButton.innerHTML = '?'
    helpButton.className = 'fixed top-4 right-4 z-50 w-10 h-10 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors shadow-lg'
    helpButton.onclick = () => driverObj.drive()
    document.body.appendChild(helpButton)

    return () => {
      if (document.body.contains(helpButton)) {
        document.body.removeChild(helpButton)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb'
          }
        }}
      />

      {/* Main Container - 80% width, centered */}
      <div className="w-4/5 mx-auto py-6 space-y-6 font-ubuntu">

        {/* Header Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Map Spectra</h1>
          <p className="text-gray-600 mt-1">Analyze weather patterns using interactive maps and time controls</p>
        </div>

        {/* Timeline Box */}
        <div id="timeline-box" className="bg-white rounded-lg shadow-sm border border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span>⏰</span>
              <span>Timeline Controls</span>
            </h2>
          </div>
          <TimelineSlider timeRange={timeRange} onTimeChange={setTimeRange} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Map Box */}
          <div id="weather-map-box" className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-500 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <span>🗺️</span>
                <span>Weather Map</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Draw polygons to analyze weather patterns</p>
            </div>
            <div className="h-[500px] relative">
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

          {/* Sidebar Box */}
          <div id="sidebar-box" className="bg-white rounded-lg shadow-sm border border-gray-700 overflow-hidden">
            <div className="h-[568px] overflow-y-auto">
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

        {/* Polygon Analysis Box */}
        <div id="polygon-box" className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span>📊</span>
              <span>Region Analysis</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">View and manage your drawn regions</p>
          </div>
          <PolygonGrid
            polygons={polygons}
            setPolygons={setPolygons}
            selectedPolygon={selectedPolygon}
            setSelectedPolygon={setSelectedPolygon}
            dataSources={dataSources}
          />
        </div>

      



      </div>
    </div>
  )
}

export default Dashboard
