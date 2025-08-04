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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Polygons Yet</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Draw polygons on the map to analyze weather data</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Use the drawing tools on the map to create your first polygon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Polygon Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {polygons.length} polygon{polygons.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📐</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {polygons.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {polygons.map((polygon, index) => (
            <div
              key={polygon.id}
              className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                selectedPolygon?.id === polygon.id
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg shadow-blue-500/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-750 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
              }`}
              onClick={() => setSelectedPolygon(polygon)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    selectedPolygon?.id === polygon.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {polygon.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Data Source: {dataSources.find(ds => ds.id === polygon.dataSourceId)?.name}
                    </div>
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePolygon(polygon.id)
                  }}
                  title="Delete polygon"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Data Values */}
              <div className="space-y-2">
                {Object.entries(polygon.data).map(([field, value]) => {
                  const unit = dataSources.find(ds => ds.field === field)?.unit || ''
                  return (
                    <div key={field} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">{field}:</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {value !== null ? value.toFixed(2) : 'N/A'} 
                        {unit && <span className="text-gray-500 ml-1">{unit}</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              {/* Selection indicator */}
              {selectedPolygon?.id === polygon.id && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Selected</span>
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
