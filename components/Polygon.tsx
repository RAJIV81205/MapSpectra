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
      <div className="p-6">
        {/* Header */}
        <div className="bg-black text-white px-4 py-2 border-b-4 border-black">
          <h3 className="text-xl font-black uppercase">POLYGON ANALYSIS</h3>
          <p className="text-sm font-bold">0 polygons created</p>
        </div>

        {/* Empty State */}
        <div className="text-center py-12 bg-gray-50">
          <div className="text-6xl mb-4">📍</div>
          <h4 className="text-2xl font-black mb-2">NO POLYGONS YET</h4>
          <p className="text-gray-600 mb-4">Draw polygons on the map to analyze weather data</p>
          <div className="bg-yellow-400 border-4 border-black px-6 py-2 inline-block font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Use the drawing tools on the map to create your first polygon
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-black text-white px-4 py-2 border-b-4 border-black mb-4">
        <h3 className="text-xl font-black uppercase">POLYGON ANALYSIS</h3>
        <p className="text-sm font-bold">{polygons.length} polygon{polygons.length !== 1 ? 's' : ''} created</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {polygons.map((polygon, index) => {
          const isSelected = selectedPolygon?.id === polygon.id

          return (
            <div
              key={polygon.id}
              className={`border-4 border-black cursor-pointer transition-all ${
                isSelected
                  ? 'bg-yellow-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform-none'
                  : 'bg-white hover:bg-gray-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
              }`}
              onClick={() => setSelectedPolygon(polygon)}
            >
              {/* Header */}
              <div className="bg-black text-white px-3 py-2 flex justify-between items-center">
                <span className="font-black text-lg">#{index + 1}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePolygon(polygon.id)
                  }}
                  className="bg-red-500 text-white px-3 py-2 border-2 border-white font-black hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-xl"
                  title="Delete polygon"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Polygon Name */}
                <div className="font-black text-lg">{polygon.name}</div>

                {/* Data Source */}
                <div>
                  <div className="text-xs font-black uppercase text-gray-600 mb-1">DATA SOURCE:</div>
                  <div className="font-bold">
                    {dataSources.find(ds => ds.id === polygon.dataSourceId)?.name?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>

                {/* Temperature Display */}
                <div>
                  <div className="text-xs font-black uppercase text-gray-600 mb-1">TEMPERATURE:</div>
                  {Object.entries(polygon.data).map(([field, value]) => {
                    const dataSource = dataSources.find(ds => ds.field === field)
                    const unit = dataSource?.unit || ''
                    return (
                      <div key={field} className="text-2xl font-black">
                        {value !== null && value !== undefined && !isNaN(value)
                          ? `${value.toFixed(1)}${unit}`
                          : 'N/A'}
                      </div>
                    )
                  })}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="bg-green-500 text-white px-3 py-1 border-2 border-black font-black text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✓ SELECTED
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
