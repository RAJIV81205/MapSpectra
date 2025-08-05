'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { DataSource, PolygonData, TimeRange } from '@/types'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

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
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [polygonCounter, setPolygonCounter] = useState(1)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingInstructions, setDrawingInstructions] = useState('')

  // Default map center - Kolkata
  const DEFAULT_CENTER: [number, number] = [88.3629, 22.5744]
  const DEFAULT_ZOOM = 11 // Previously was 10

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Center map to default location
  const centerMap = () => {
    if (!mapRef.current) return
    
    mapRef.current.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      essential: true
    })
    toast.success('Map centered to default location')
  }

  // Sync polygon deletion from polygon grid
  useEffect(() => {
    if (!mapRef.current || !drawRef.current) return

    // Get current features from draw
    const currentFeatures = drawRef.current.getAll()
    const currentFeatureIds = currentFeatures.features.map(f => f.id as string)
    const polygonIds = polygons.map(p => p.id)

    // Find features that exist on map but not in polygons state (deleted from grid)
    const featuresToDelete = currentFeatureIds.filter(id => !polygonIds.includes(id))

    // Remove features from map that were deleted from grid
    featuresToDelete.forEach(featureId => {
      // Remove from draw
      drawRef.current?.delete(featureId)
      
      // Remove custom layers and sources
      if (mapRef.current?.getLayer(`polygon-fill-${featureId}`)) {
        mapRef.current.removeLayer(`polygon-fill-${featureId}`)
      }
      if (mapRef.current?.getLayer(`polygon-stroke-${featureId}`)) {
        mapRef.current.removeLayer(`polygon-stroke-${featureId}`)
      }
      if (mapRef.current?.getSource(`polygon-source-${featureId}`)) {
        mapRef.current.removeSource(`polygon-source-${featureId}`)
      }
    })
  }, [polygons])

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

  const calculatePolygonColor = (value: number | null, dataSource: DataSource): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '#9ca3af'
    }

    const sortedThresholds = [...dataSource.thresholds].sort((a, b) => {
      if (a.operator.includes('>=') || a.operator.includes('>')) {
        return b.value - a.value
      }
      return a.value - b.value
    })

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
    return '#9ca3af'
  }

  const getPolygonCenter = (coordinates: number[][][]): [number, number] => {
    const coords = coordinates[0]
    let x = 0, y = 0
    coords.forEach(coord => {
      x += coord[0]
      y += coord[1]
    })
    return [x / coords.length, y / coords.length]
  }

  const finishDrawing = () => {
    if (drawRef.current && isDrawing) {
      const mode = drawRef.current.getMode()
      if (mode === 'draw_polygon') {
        drawRef.current.changeMode('simple_select')
        setIsDrawing(false)
        setDrawingInstructions('')
        toast.success('Polygon completed!')
      }
    }
  }

  useEffect(() => {
    const updatePolygonColors = async () => {
      if (!polygons.length || !mapRef.current || !drawRef.current) return

      const activeDataSource = dataSources.find(ds => ds.isActive)
      if (!activeDataSource) return

      setIsLoading(true)

      try {
        const updatedPolygons = await Promise.all(
          polygons.map(async (polygon) => {
            const feature = drawRef.current?.get(polygon.id)
            if (!feature || feature.geometry.type !== 'Polygon') return polygon

            const [centerLng, centerLat] = getPolygonCenter(feature.geometry.coordinates)
            const value = await fetchWeatherData(centerLat, centerLng, activeDataSource.field)

            const updatedPolygon = {
              ...polygon,
              dataSourceId: activeDataSource.id,
              data: { [activeDataSource.field]: value }
            }

            const color = calculatePolygonColor(value, activeDataSource)

            if (mapRef.current?.getLayer(`polygon-fill-${polygon.id}`)) {
              mapRef.current?.setPaintProperty(`polygon-fill-${polygon.id}`, 'fill-color', color)
            }

            if (mapRef.current?.getLayer(`polygon-stroke-${polygon.id}`)) {
              mapRef.current?.setPaintProperty(`polygon-stroke-${polygon.id}`, 'line-color', '#6b7280')
            }

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

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return

    const initializeMap = () => {
      try {
        setIsLoading(true)

        if (!mapContainerRef.current) {
          console.error('Map container ref is null')
          setIsLoading(false)
          return
        }

        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: 2,
          maxZoom: 18
        })

        // Add navigation controls
        const nav = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        })
        map.addControl(nav, 'top-right')

        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true
        })


        map.addControl(geolocate, 'top-right')

        // Add fullscreen control
        const fullscreen = new mapboxgl.FullscreenControl()
        map.addControl(fullscreen, 'top-right')

        // Add scale control
        const scale = new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        })
        map.addControl(scale, 'bottom-left')

        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
          defaultMode: 'simple_select',
          styles: [
            {
              'id': 'gl-draw-polygon-fill-inactive',
              'type': 'fill',
              'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'paint': {
                'fill-color': '#3b82f6',
                'fill-outline-color': '#3b82f6',
                'fill-opacity': 0.3
              }
            },
            {
              'id': 'gl-draw-polygon-stroke-inactive',
              'type': 'line',
              'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                'line-color': '#3b82f6',
                'line-width': 2
              }
            },
            {
              'id': 'gl-draw-polygon-fill-active',
              'type': 'fill',
              'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
              'paint': {
                'fill-color': '#10b981',
                'fill-outline-color': '#10b981',
                'fill-opacity': 0.3
              }
            },
            {
              'id': 'gl-draw-polygon-stroke-active',
              'type': 'line',
              'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                'line-color': '#10b981',
                'line-width': 2
              }
            },
            {
              'id': 'gl-draw-polygon-and-line-vertex-active',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
              'paint': {
                'circle-radius': 4,
                'circle-color': '#ffffff',
                'circle-stroke-color': '#10b981',
                'circle-stroke-width': 2
              }
            }
          ]
        })

        map.addControl(draw, 'top-left')

        map.on('load', () => {
          console.log('Map loaded successfully')
          setIsLoading(false)
        })

        map.on('error', (e) => {
          console.error('Map error:', e.error)
          setIsLoading(false)
          toast.error('Map failed to load')
        })

        map.on('draw.modechange', (e: { mode: string }) => {
          if (e.mode === 'draw_polygon') {
            setIsDrawing(true)
            setDrawingInstructions('Click to add points. Double-click or press Enter to finish polygon.')
            toast.success('Started drawing polygon. Click to add points, double-click to finish!', {
              duration: 4000
            })
          } else {
            setIsDrawing(false)
            setDrawingInstructions('')
          }
        })

        map.on('draw.create', async (e: any) => {
          const feature = e.features[0]
          if (feature.geometry.type !== 'Polygon') return

          setIsDrawing(false)
          setDrawingInstructions('')

          const activeDataSource = dataSources.find(ds => ds.isActive)
          if (!activeDataSource) {
            toast.dismiss()
            toast.error('No active data source selected')
            draw.delete(feature.id as string)
            return
          }

          const [centerLng, centerLat] = getPolygonCenter(feature.geometry.coordinates)

          toast.dismiss()
          const loadingToast = toast.loading('Fetching weather data...')

          try {
            const value = await fetchWeatherData(centerLat, centerLng, activeDataSource.field)

            const polygonData: PolygonData = {
              id: feature.id as string,
              layer: feature as any,
              dataSourceId: activeDataSource.id,
              data: { [activeDataSource.field]: value },
              name: `Region ${polygonCounter}`
            }

            const color = calculatePolygonColor(value, activeDataSource)

            map.addSource(`polygon-source-${feature.id}`, {
              type: 'geojson',
              data: feature
            })

            map.addLayer({
              id: `polygon-fill-${feature.id}`,
              type: 'fill',
              source: `polygon-source-${feature.id}`,
              paint: {
                'fill-color': ['case', ['boolean', ['feature-state', 'hover'], false], color, color],
                'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.8, 0.6]
              }
            })

            map.addLayer({
              id: `polygon-stroke-${feature.id}`,
              type: 'line',
              source: `polygon-source-${feature.id}`,
              paint: {
                'line-color': '#374151',
                'line-width': 2
              }
            })

            map.on('mouseenter', `polygon-fill-${feature.id}`, () => {
              map.getCanvas().style.cursor = 'pointer'
              map.setFeatureState({ source: `polygon-source-${feature.id}`, id: feature.id }, { hover: true })
            })

            map.on('mouseleave', `polygon-fill-${feature.id}`, () => {
              map.getCanvas().style.cursor = ''
              map.setFeatureState({ source: `polygon-source-${feature.id}`, id: feature.id }, { hover: false })
            })

            map.on('click', `polygon-fill-${feature.id}`, () => {
              setSelectedPolygon(polygonData)
            })

            setPolygons(prev => [...prev, polygonData])
            setPolygonCounter(prev => prev + 1)
            toast.success('Polygon created successfully!', { id: loadingToast })
          } catch (error) {
            console.error('Error creating polygon:', error)
            toast.error('Failed to create polygon', { id: loadingToast })
            draw.delete(feature.id as string)
          }
        })

        map.on('draw.delete', (e: any) => {
          const deletedFeatures = e.features
          deletedFeatures.forEach((feature: any) => {
            if (map.getLayer(`polygon-fill-${feature.id}`)) {
              map.removeLayer(`polygon-fill-${feature.id}`)
            }
            if (map.getLayer(`polygon-stroke-${feature.id}`)) {
              map.removeLayer(`polygon-stroke-${feature.id}`)
            }
            if (map.getSource(`polygon-source-${feature.id}`)) {
              map.removeSource(`polygon-source-${feature.id}`)
            }
            setPolygons(prev => prev.filter(p => p.id !== feature.id))
          })
          setSelectedPolygon(null)
          toast.dismiss()
          toast.success('Polygon(s) deleted')
        })

        map.on('keydown', (e:any) => {
          if (e.originalEvent.key === 'Enter' && isDrawing) {
            finishDrawing()
          }
        })

        mapRef.current = map
        drawRef.current = draw
      } catch (err) {
        console.error('Failed to initialize map:', err)
        toast.dismiss()
        toast.error('Failed to initialize map')
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(initializeMap, 100)
    return () => {
      clearTimeout(timeoutId)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Center Map Button */}
      <div className="absolute bottom-0 left-0 z-10">
        <button
          onClick={centerMap}
          className="px-3 py-2 bg-white text-gray-700 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center space-x-2"
          title="Center map to default location"
        >
          <span>Center </span>
        </button>
      </div>

      {/* Drawing Instructions Overlay */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">{drawingInstructions}</span>
            <button
              onClick={finishDrawing}
              className="px-3 py-1 bg-white text-blue-500 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Finish
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Updating polygons...</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Controls</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <div>🎯 <strong>Center:</strong> Return to default location</div>
          <div>📍 <strong>Geolocate:</strong> Find your current location</div>
          <div>🔍 <strong>Zoom:</strong> Use +/- buttons or mouse wheel</div>
          <div>📐 <strong>Draw:</strong> Click polygon tool, then click map points</div>
          <div>⌨️ <strong>Finish:</strong> Double-click, press Enter, or click Finish</div>
          <div>🗑️ <strong>Delete:</strong> Select polygon and click trash</div>
        </div>
      </div>
    </div>
  )
}

export default Map
