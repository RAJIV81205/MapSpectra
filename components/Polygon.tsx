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
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="bg-black text-white px-4 py-3 font-mono font-black text-xl border-b-4 border-black">
          <div className="flex items-center justify-between">
            <span>POLYGON ANALYSIS</span>
            <span className="bg-white text-black px-3 py-1 text-sm font-black">
              0 polygons created
            </span>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-8 text-center">
          <div className="text-6xl font-black mb-4 font-mono text-black">
            📍
          </div>
          <div className="text-2xl font-black mb-4 font-mono text-black">
            NO POLYGONS YET
          </div>
          <div className="text-lg font-bold mb-6 font-mono text-gray-700">
            Draw polygons on the map to analyze weather data
          </div>
          <div className="bg-gray-100 border-4 border-black p-4 font-mono font-bold text-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Use the drawing tools on the map to create your first polygon
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="bg-black text-white px-4 py-3 font-mono font-black text-xl border-b-4 border-black">
        <div className="flex items-center justify-between">
          <span>POLYGON ANALYSIS</span>
          <span className="bg-white text-black px-3 py-1 text-sm font-black">
            {polygons.length} polygon{polygons.length !== 1 ? 's' : ''} created
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {polygons.map((polygon, index) => {
          const isSelected = selectedPolygon?.id === polygon.id
          
          return (
            <div
              key={polygon.id}
              className={`bg-white border-4 border-black cursor-pointer transform transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                isSelected 
                  ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ring-4 ring-yellow-400' 
                  : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              }`}
              onClick={() => setSelectedPolygon(polygon)}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b-4 border-black bg-black text-white">
                <div className="bg-white text-black px-3 py-1 font-black text-lg font-mono border-2 border-white">
                  {index + 1}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePolygon(polygon.id)
                  }}
                  className="bg-red-500 text-white px-3 py-2 border-2 border-white font-black hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-xl"
                  title="Delete polygon"
                >
                  ✗
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Polygon Name */}
                <div className="font-black text-xl font-mono text-black">
                  {polygon.name}
                </div>

                {/* Data Source */}
                <div className="bg-purple-200 border-4 border-black p-3 font-mono font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase tracking-wider mb-1">DATA SOURCE:</div>
                  <div className="text-lg font-black">
                    {dataSources.find(ds => ds.id === polygon.dataSourceId)?.name?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>

                {/* Temperature Display */}
                <div className="font-mono">
                  <div className="font-bold text-sm mb-2 text-black uppercase tracking-wider">
                    TEMPERATURE:
                  </div>
                  <div className="text-3xl font-black border-4 border-black p-4 bg-gray-800 text-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {Object.entries(polygon.data).map(([field, value]) => {
                      const dataSource = dataSources.find(ds => ds.field === field)
                      const unit = dataSource?.unit || ''
                      return (
                        <span key={field}>
                          {value !== null && value !== undefined && !isNaN(value)
                            ? `${value.toFixed(1)}${unit}`
                            : 'N/A'}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="text-center">
                    <div className="bg-green-500 text-black px-4 py-2 border-4 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono">
                      ✓ SELECTED
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PolygonGrid
