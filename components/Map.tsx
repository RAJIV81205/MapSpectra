'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { DataSource, PolygonData, TimeRange } from '@/types'

interface MapComponentProps {
  timeRange: TimeRange
  dataSources: DataSource[]
  polygons: PolygonData[]
  setPolygons: React.Dispatch<React.SetStateAction<PolygonData[]>>
  selectedPolygon: PolygonData | null
  setSelectedPolygon: React.Dispatch<React.SetStateAction<PolygonData | null>>
}

const Map: React.FC<MapComponentProps> = ({
  timeRange,
  dataSources,
  polygons,
  setPolygons,
  selectedPolygon,
  setSelectedPolygon
}) => {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const drawnItemsRef = useRef<any>(null)
  const { theme } = useTheme()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch weather data from Open-Meteo API
  const fetchWeatherData = async (lat: number, lng: number, field: string) => {
    try {
      const startDate = new Date(timeRange.start)
      const endDate = new Date(timeRange.end)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=${field}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.hourly && data.hourly[field]) {
        // Calculate average value for the time range
        const values = data.hourly[field]
        const validValues = values.filter((v: number) => v !== null && v !== undefined)
        
        if (validValues.length === 0) return null
        
        if (timeRange.mode === 'single') {
          const hourIndex = Math.floor((timeRange.start.getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60))
          return values[hourIndex] || null
        } else {
          const sum = validValues.reduce((acc: number, val: number) => acc + val, 0)
          return sum / validValues.length
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching weather data:', error)
      return null
    }
  }

  // Calculate polygon color based on data and thresholds
  const calculatePolygonColor = (value: number, dataSource: DataSource) => {
    if (value === null || value === undefined) return '#gray-400'
    
    // Sort thresholds by value for proper evaluation
    const sortedThresholds = [...dataSource.thresholds].sort((a, b) => {
      if (a.operator === '=' && b.operator !== '=') return -1
      if (a.operator !== '=' && b.operator === '=') return 1
      return a.value - b.value
    })
    
    for (const threshold of sortedThresholds) {
      switch (threshold.operator) {
        case '>=':
          if (value >= threshold.value) return threshold.color
          break
        case '>':
          if (value > threshold.value) return threshold.color
          break
        case '<=':
          if (value <= threshold.value) return threshold.color
          break
        case '<':
          if (value < threshold.value) return threshold.color
          break
        case '=':
          if (Math.abs(value - threshold.value) < 0.01) return threshold.color
          break
      }
    }
    
    return dataSource.thresholds[0]?.color || '#gray-400'
  }

  // Update polygon colors when time range or data sources change
  useEffect(() => {
    const updatePolygonColors = async () => {
      if (!polygons.length) return
      
      const activeDataSource = dataSources.find(ds => ds.isActive)
      if (!activeDataSource) return
      
      const updatedPolygons = await Promise.all(
        polygons.map(async (polygon) => {
          // Get polygon centroid
          const bounds = polygon.layer.getBounds()
          const center = bounds.getCenter()
          
          // Fetch weather data
          const value = await fetchWeatherData(center.lat, center.lng, activeDataSource.field)
          
          // Update polygon data and color
          const updatedPolygon = {
            ...polygon,
            dataSourceId: activeDataSource.id,
            data: { [activeDataSource.field]: value }
          }
          
          if (value !== null) {
            const color = calculatePolygonColor(value, activeDataSource)
            polygon.layer.setStyle({
              fillColor: color,
              color: color,
              fillOpacity: 0.6,
              weight: 2
            })
          }
          
          return updatedPolygon
        })
      )
      
      setPolygons(updatedPolygons)
    }
    
    updatePolygonColors()
  }, [timeRange, dataSources])

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return

    const initializeMap = async () => {
      try {
        setIsLoading(true)
        
        const L = await import('leaflet')
        await import('leaflet-draw')
        
        const DrawEvents = (L as any).Draw?.Event || {
          CREATED: 'draw:created',
          DELETED: 'draw:deleted'
        }

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Create map instance with locked zoom for 2 sq km resolution
        const map = L.map(mapContainerRef.current!, {
          center: [22.5744, 88.3629],
          zoom: 10,
          minZoom: 10,
          maxZoom: 10,
          zoomControl: true
        })

        // Add tile layer
        const tileLayer = theme === 'dark' 
          ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
              subdomains: 'abcd',
              maxZoom: 20
            })
          : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 20
            })

        tileLayer.addTo(map)

        // Create feature group for drawn items
        const drawnItems = new L.FeatureGroup()
        map.addLayer(drawnItems)
        drawnItemsRef.current = drawnItems

        // Initialize drawing controls
        const DrawControl = (L as any).Control?.Draw
        const drawControl = new DrawControl({
          position: 'topright',
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              showLength: true,
              shapeOptions: {
                color: '#007cba',
                fillOpacity: 0.3
              }
            },
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false
          },
          edit: {
            featureGroup: drawnItems,
            remove: true
          }
        })

        map.addControl(drawControl)

        // Event handlers
        map.on(DrawEvents.CREATED, async (e: any) => {
          const layer = e.layer
          const polygonId = `polygon_${Date.now()}`
          
          drawnItems.addLayer(layer)
          
          // Get active data source
          const activeDataSource = dataSources.find(ds => ds.isActive)
          if (!activeDataSource) return
          
          // Get polygon centroid for API call
          const bounds = layer.getBounds()
          const center = bounds.getCenter()
          
          // Fetch real weather data
          const value = await fetchWeatherData(center.lat, center.lng, activeDataSource.field)
          
          const polygonData: PolygonData = {
            id: polygonId,
            layer: layer,
            dataSourceId: activeDataSource.id,
            data: { [activeDataSource.field]: value },
            name: `Polygon ${polygons.length + 1}`
          }
          
          // Apply color based on fetched data
          if (value !== null) {
            const color = calculatePolygonColor(value, activeDataSource)
            layer.setStyle({
              fillColor: color,
              color: color,
              fillOpacity: 0.6,
              weight: 2
            })
          }
          
          // Add click handler
          layer.on('click', () => {
            setSelectedPolygon(polygonData)
          })
          
          setPolygons(prev => [...prev, polygonData])
        })

        map.on(DrawEvents.DELETED, (e: any) => {
          const deletedLayers = e.layers._layers
          Object.keys(deletedLayers).forEach(layerId => {
            setPolygons(prev => prev.filter(p => p.layer._leaflet_id !== parseInt(layerId)))
          })
          setSelectedPolygon(null)
        })

        mapRef.current = map
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize map:', err)
        setIsLoading(false)
      }
    }

    initializeMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isClient, theme])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Initializing map...</div>
        </div>
      )}
    </div>
  )
}

export default Map
