'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import toast from 'react-hot-toast'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { DataSource, PolygonData, TimeRange } from '@/types'

// Set the access token immediately
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
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const { theme } = useTheme()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [polygonCounter, setPolygonCounter] = useState(1)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
      return '#cccccc'
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
    return '#cccccc'
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
            
            // Update the feature styling
            if (mapRef.current?.getLayer(`polygon-fill-${polygon.id}`)) {
              mapRef.current?.setPaintProperty(`polygon-fill-${polygon.id}`, 'fill-color', color)
            }
            if (mapRef.current?.getLayer(`polygon-stroke-${polygon.id}`)) {
              mapRef.current?.setPaintProperty(`polygon-stroke-${polygon.id}`, 'line-color', '#000000')
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

        // Clear any existing map
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
          center: [88.3629, 22.5744], // Longitude, Latitude
          zoom: 10,
          minZoom: 8,
          maxZoom: 15
        })

        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          }
        })

        map.addControl(draw, 'top-right')

        map.on('load', () => {
          console.log('Map loaded successfully')
          setIsLoading(false)
        })

        map.on('error', (e) => {
          console.error('Map error:', e.error)
          setIsLoading(false)
          toast.error('Map failed to load')
        })

        map.on('draw.create', async (e: any) => {
          const feature = e.features[0]
          if (feature.geometry.type !== 'Polygon') return

          const activeDataSource = dataSources.find(ds => ds.isActive)
          if (!activeDataSource) {
            toast.dismiss()
            toast.error('No active data source selected')
            draw.delete(feature.id as string)
            return
          }

          const [centerLng, centerLat] = getPolygonCenter(feature.geometry.coordinates)
          
          toast.dismiss()
          const loadingToast = toast.loading('FETCHING WEATHER DATA...')

          try {
            const value = await fetchWeatherData(centerLat, centerLng, activeDataSource.field)
            
            const polygonData: PolygonData = {
              id: feature.id as string,
              layer: feature as any,
              dataSourceId: activeDataSource.id,
              data: { [activeDataSource.field]: value },
              name: `Polygon ${polygonCounter}`
            }

            const color = calculatePolygonColor(value, activeDataSource)

            // Add custom styling for this specific polygon
            map.addSource(`polygon-source-${feature.id}`, {
              type: 'geojson',
              data: feature
            })

            map.addLayer({
              id: `polygon-fill-${feature.id}`,
              type: 'fill',
              source: `polygon-source-${feature.id}`,
              paint: {
                'fill-color': color,
                'fill-opacity': 0.7
              }
            })

            map.addLayer({
              id: `polygon-stroke-${feature.id}`,
              type: 'line',
              source: `polygon-source-${feature.id}`,
              paint: {
                'line-color': '#000000',
                'line-width': 4
              }
            })

            // Add click handler for polygon selection
            map.on('click', `polygon-fill-${feature.id}`, () => {
              setSelectedPolygon(polygonData)
            })

            setPolygons(prev => [...prev, polygonData])
            setPolygonCounter(prev => prev + 1)
            toast.success('POLYGON CREATED SUCCESSFULLY!', { id: loadingToast })
          } catch (error) {
            toast.error('FAILED TO CREATE POLYGON', { id: loadingToast })
            draw.delete(feature.id as string)
          }
        })

        map.on('draw.delete', (e: any) => {
          const deletedFeatures = e.features
          deletedFeatures.forEach((feature: any) => {
            // Remove custom layers
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
          toast.success('POLYGON(S) DELETED')
        })

        mapRef.current = map
        drawRef.current = draw

      } catch (err) {
        console.error('Failed to initialize map:', err)
        toast.dismiss()
        toast.error('FAILED TO INITIALIZE MAP')
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeMap, 100)

    return () => {
      clearTimeout(timeoutId)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isClient, theme])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border-4 border-black">
        <div className="text-2xl font-black text-black">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full border-4 border-black"
        style={{ minHeight: '400px', height: '100%', width: '100%' }}
      />
      {isLoading && (
        <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-2 border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          UPDATING POLYGONS...
        </div>
      )}
    </div>
  )
}

export default Map
