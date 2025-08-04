'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import toast from 'react-hot-toast'
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
  const fetchWeatherData = async (lat: number, lng: number, field: string): Promise<number | null> => {
    try {
      const startDate = new Date(timeRange.start)
      const endDate = new Date(timeRange.end)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=${field}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.reason || 'API returned an error')
      }

      if (data.hourly && data.hourly[field]) {
        const values = data.hourly[field]
        const validValues = values.filter((v: number) => v !== null && v !== undefined && !isNaN(v))
        
        if (validValues.length === 0) {
          throw new Error('No valid data available for this location and time')
        }

        if (timeRange.mode === 'single') {
          const hourIndex = Math.floor((timeRange.start.getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60))
          const value = values[Math.min(hourIndex, values.length - 1)]
          
          if (value === null || value === undefined || isNaN(value)) {
            throw new Error('No data available for selected time')
          }
          
          return value
        } else {
          const sum = validValues.reduce((acc: number, val: number) => acc + val, 0)
          return sum / validValues.length
        }
      } else {
        throw new Error('Invalid API response structure')
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
      
      // Show toast notification for API errors with dismiss previous toasts
      toast.dismiss()
      
      if (error instanceof Error) {
        if (error.message.includes('API request failed')) {
          toast.error('Weather API is currently unavailable. Please try again later.')
        } else if (error.message.includes('No valid data')) {
          toast.error('No weather data available for this location and time.')
        } else {
          toast.error(`Weather data error: ${error.message}`)
        }
      } else {
        toast.error('Failed to fetch weather data. Please check your connection.')
      }

      return null
    }
  }

  // Fixed: Corrected polygon color calculation with better logic
  const calculatePolygonColor = (value: number | null, dataSource: DataSource): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '#cccccc'
    }

    // Sort thresholds by value in descending order for proper evaluation
    const sortedThresholds = [...dataSource.thresholds].sort((a, b) => {
      if (a.operator.includes('>=') || a.operator.includes('>')) {
        return b.value - a.value // Descending for >= operators
      }
      return a.value - b.value // Ascending for < operators
    })

    // Process thresholds in sorted order
    for (const threshold of sortedThresholds) {
      let conditionMet = false

      switch (threshold.operator) {
        case '>=':
          conditionMet = value >= threshold.value
          break
        case '>':
          conditionMet = value > threshold.value
          break
        case '<=':
          conditionMet = value <= threshold.value
          break
        case '<':
          conditionMet = value < threshold.value
          break
        case '=':
          conditionMet = Math.abs(value - threshold.value) < 0.01
          break
        default:
          conditionMet = false
      }

      if (conditionMet) {
        return threshold.color
      }
    }

    // Return default color if no thresholds match
    return '#cccccc'
  }

  // Separate effect for updating polygon colors without reinitializing the map
  useEffect(() => {
    const updatePolygonColors = async () => {
      if (!polygons.length || !mapRef.current) return

      const activeDataSource = dataSources.find(ds => ds.isActive)
      if (!activeDataSource) return

      setIsLoading(true)

      try {
        const updatedPolygons = await Promise.all(
          polygons.map(async (polygon) => {
            // Get polygon centroid
            const bounds = polygon.layer.getBounds()
            const center = bounds.getCenter()

            // Fetch weather data
            const value = await fetchWeatherData(center.lat, center.lng, activeDataSource.field)

            // Update polygon data
            const updatedPolygon = {
              ...polygon,
              dataSourceId: activeDataSource.id,
              data: { [activeDataSource.field]: value }
            }

            // Apply color based on fetched data
            const color = calculatePolygonColor(value, activeDataSource)
            polygon.layer.setStyle({
              fillColor: color,
              color: color,
              fillOpacity: 0.6,
              weight: 2
            })

            return updatedPolygon
          })
        )

        setPolygons(updatedPolygons)
      } catch (error) {
        console.error('Error updating polygon colors:', error)
        toast.dismiss()
        toast.error('Failed to update polygon data')
      } finally {
        setIsLoading(false)
      }
    }

    updatePolygonColors()
  }, [timeRange, dataSources])

  // Initialize map - REMOVED dataSources from dependency array to prevent re-initialization
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

        // Create map instance
        const map = L.map(mapContainerRef.current!, {
          center: [22.5744, 88.3629],
          zoom: 10,
          minZoom: 8,
          maxZoom: 15,
          zoomControl: true
        })

        // Add tile layer
        const tileLayer = theme === 'dark'
          ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '© OpenStreetMap contributors © CARTO',
              subdomains: 'abcd',
              maxZoom: 20
            })
          : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
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

        // Handle polygon creation
        map.on(DrawEvents.CREATED, async (e: any) => {
          const layer = e.layer

          // Add temporary styling
          layer.setStyle({
            color: '#ff6b6b',
            fillColor: '#ff6b6b',
            fillOpacity: 0.3,
            weight: 2,
            dashArray: '5, 5'
          })

          // Create confirmation popup
          const confirmPopup = L.popup({
            closeButton: false,
            autoClose: false,
            closeOnEscapeKey: true,
            className: 'polygon-confirm-popup'
          })
            .setLatLng(layer.getBounds().getCenter())
            .setContent(`
              <div class="text-center">
                <p class="mb-2 text-sm">Save this polygon?</p>
                <button id="save-polygon" class="bg-green-500 text-white px-2 py-1 rounded mr-2 text-xs">✓ Save</button>
                <button id="cancel-polygon" class="bg-red-500 text-white px-2 py-1 rounded text-xs">✗ Cancel</button>
              </div>
            `)
            .openOn(map)

          // Handle save confirmation
          const handleSave = async () => {
            const polygonId = `polygon_${Date.now()}`
            drawnItems.addLayer(layer)

            // Get active data source
            const activeDataSource = dataSources.find(ds => ds.isActive)
            if (!activeDataSource) {
              map.closePopup()
              toast.dismiss()
              toast.error('No active data source selected')
              return
            }

            // Get polygon centroid for API call
            const bounds = layer.getBounds()
            const center = bounds.getCenter()

            // Show loading state
            layer.setStyle({
              color: '#ffc107',
              fillColor: '#ffc107',
              fillOpacity: 0.5,
              weight: 2,
              dashArray: null
            })

            // Show loading toast
            toast.dismiss()
            const loadingToast = toast.loading('Fetching weather data...')

            try {
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
              const color = calculatePolygonColor(value, activeDataSource)
              layer.setStyle({
                fillColor: color,
                color: color,
                fillOpacity: 0.6,
                weight: 2,
                dashArray: null
              })

              // Add click handler
              layer.on('click', () => {
                setSelectedPolygon(polygonData)
              })

              setPolygons(prev => [...prev, polygonData])
              toast.success('Polygon created successfully!', { id: loadingToast })
            } catch (error) {
              toast.error('Failed to create polygon', { id: loadingToast })
              map.removeLayer(layer)
            }

            map.closePopup()
          }

          const handleCancel = () => {
            map.removeLayer(layer)
            map.closePopup()
          }

          // Add event listeners
          setTimeout(() => {
            const saveBtn = document.getElementById('save-polygon')
            const cancelBtn = document.getElementById('cancel-polygon')
            if (saveBtn) saveBtn.addEventListener('click', handleSave)
            if (cancelBtn) cancelBtn.addEventListener('click', handleCancel)
          }, 100)
        })

        map.on(DrawEvents.DELETED, (e: any) => {
          const deletedLayers = e.layers._layers
          Object.keys(deletedLayers).forEach(layerId => {
            setPolygons(prev => prev.filter(p => p.layer._leaflet_id !== parseInt(layerId)))
          })
          setSelectedPolygon(null)
          toast.dismiss()
          toast.success('Polygon(s) deleted')
        })

        mapRef.current = map
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize map:', err)
        toast.dismiss()
        toast.error('Failed to initialize map')
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
  }, [isClient, theme]) // REMOVED dataSources from here

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {isLoading && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
          Updating polygons...
        </div>
      )}
    </div>
  )
}

export default Map
