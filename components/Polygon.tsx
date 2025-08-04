'use client'

import React from 'react'
import { DataSource, PolygonData } from '@/types'

interface PolygonGridProps {
  polygons: PolygonData[]
  setPolygons: React.Dispatch<React.SetStateAction<PolygonData[]>>
  selectedPolygon: PolygonData | null
  setSelectedPolygon: React.Dispatch<React.SetStateAction<PolygonData | null>>
  dataSources: DataSource[]
}

const PolygonGrid: React.FC<PolygonGridProps> = ({
  polygons,
  setPolygons,
  selectedPolygon,
  setSelectedPolygon,
  dataSources
}) => {
  const deletePolygon = (polygonId: string) => {
    const polygon = polygons.find(p => p.id === polygonId)
    if (polygon) {
      polygon.layer.remove()
      setPolygons(polygons.filter(p => p.id !== polygonId))
      if (selectedPolygon?.id === polygonId) {
        setSelectedPolygon(null)
      }
    }
  }

  if (polygons.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No Polygons Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Draw polygons on the map to analyze weather data</p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Use the drawing tools on the map to create your first polygon
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Polygon Analysis</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {polygons.length} polygon{polygons.length !== 1 ? 's' : ''} created
        </p>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {polygons.map((polygon, index) => (
            <div
              key={polygon.id}
              className={`relative bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                selectedPolygon?.id === polygon.id 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-transparent'
              }`}
              onClick={() => setSelectedPolygon(polygon)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{polygon.name}</span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePolygon(polygon.id)
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                  title="Delete polygon"
                >
                  ✕
                </button>
              </div>

              {/* Data Source */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Data Source: {dataSources.find(ds => ds.id === polygon.dataSourceId)?.name}
              </div>

              {/* Data Values */}
              <div className="space-y-2">
                {Object.entries(polygon.data).map(([field, value]) => {
                  const dataSource = dataSources.find(ds => ds.field === field)
                  const unit = dataSource?.unit || ''
                  
                  return (
                    <div key={field} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {dataSource?.name || field}:
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {value !== null && value !== undefined && !isNaN(value) 
                          ? `${value.toFixed(1)}${unit}` 
                          : 'N/A'
                        }
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Selection indicator */}
              {selectedPolygon?.id === polygon.id && (
                <div className="absolute top-2 right-2">
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Selected
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PolygonGrid
