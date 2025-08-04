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

  useEffect(() => {
    const updatePolygonColors = async () => {
      if (!polygons.length || !mapRef.current) return

      const activeDataSource = dataSources.find(ds => ds.isActive)
      if (!activeDataSource) return

      setIsLoading(true)
      try {
        const updatedPolygons = await Promise.all(
          polygons.map(async (polygon) => {
            const bounds = polygon.layer.getBounds()
            const center = bounds.getCenter()
            const value = await fetchWeatherData(center.lat, center.lng, activeDataSource.field)

            const updatedPolygon = {
              ...polygon,
              dataSourceId: activeDataSource.id,
              data: { [activeDataSource.field]: value }
            }

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

        // Fix leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // FIXED: Ensure mapContainerRef.current exists before using it
        if (!mapContainerRef.current) return

        const map = L.map(mapContainerRef.current, {
          center: [22.5744, 88.3629],
          zoom: 10,
          minZoom: 8,
          maxZoom: 15,
          zoomControl: true
        })

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

        const drawnItems = new L.FeatureGroup()
        map.addLayer(drawnItems)
        drawnItemsRef.current = drawnItems

        const DrawControl = (L as any).Control?.Draw
        const drawControl = new DrawControl({
          position: 'topright',
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              showLength: true,
              shapeOptions: {
                color: '#ff0000',
                fillOpacity: 0.3,
                weight: 4
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

        map.on(DrawEvents.CREATED, async (e: any) => {
          const layer = e.layer
          layer.setStyle({
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.5,
            weight: 4,
            dashArray: '10, 10'
          })

          const confirmPopup = L.popup({
            closeButton: false,
            autoClose: false,
            closeOnEscapeKey: true,
            className: 'brutal-popup'
          })
            .setLatLng(layer.getBounds().getCenter())
            .setContent(`
              <div class="text-center p-2 font-mono">
                <div class="text-lg font-black mb-2">Save this polygon?</div>
                <div class="flex gap-2 justify-center">
                  <button id="save-polygon" class="bg-green-500 text-white px-3 py-1 border-2 border-white font-black text-sm">
                    ✓ SAVE
                  </button>
                  <button id="cancel-polygon" class="bg-red-500 text-white px-3 py-1 border-2 border-white font-black text-sm">
                    ✗ CANCEL
                  </button>
                </div>
              </div>
            `)
            .openOn(map)

          const handleSave = async () => {
            const polygonId = `polygon_${Date.now()}`
            drawnItems.addLayer(layer)

            const activeDataSource = dataSources.find(ds => ds.isActive)
            if (!activeDataSource) {
              map.closePopup()
              toast.dismiss()
              toast.error('No active data source selected')
              return
            }

            const bounds = layer.getBounds()
            const center = bounds.getCenter()

            layer.setStyle({
              color: '#ffff00',
              fillColor: '#ffff00',
              fillOpacity: 0.7,
              weight: 4,
              dashArray: '5, 5'
            })

            toast.dismiss()
            const loadingToast = toast.loading('FETCHING WEATHER DATA...')

            try {
              const value = await fetchWeatherData(center.lat, center.lng, activeDataSource.field)

              const polygonData: PolygonData = {
                id: polygonId,
                layer: layer,
                dataSourceId: activeDataSource.id,
                data: { [activeDataSource.field]: value },
                name: `Polygon ${polygonCounter}`
              }

              const color = calculatePolygonColor(value, activeDataSource)
              layer.setStyle({
                fillColor: color,
                color: '#000000',
                fillOpacity: 0.7,
                weight: 4,
                dashArray: null
              })

              layer.on('click', () => {
                setSelectedPolygon(polygonData)
              })

              setPolygons(prev => [...prev, polygonData])
              setPolygonCounter(prev => prev + 1)

              toast.success('POLYGON CREATED SUCCESSFULLY!', { id: loadingToast })
            } catch (error) {
              toast.error('FAILED TO CREATE POLYGON', { id: loadingToast })
              map.removeLayer(layer)
            }

            map.closePopup()
          }

          const handleCancel = () => {
            map.removeLayer(layer)
            map.closePopup()
          }

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
          toast.success('POLYGON(S) DELETED')
        })

        mapRef.current = map
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize map:', err)
        toast.dismiss()
        toast.error('FAILED TO INITIALIZE MAP')
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
      <div className="h-96 flex items-center justify-center bg-gray-100 border-4 border-black">
        <div className="text-xl font-black">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative h-96">
      {isLoading && (
        <div className="absolute top-4 right-4 z-50 bg-yellow-400 border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          UPDATING POLYGONS...
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full border-4 border-black" />
    </div>
  )
}

export default Map
