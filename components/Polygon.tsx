'use client'

import React, { useState } from 'react'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const deletePolygon = (polygonId: string) => {
    const polygon = polygons.find(p => p.id === polygonId)
    if (polygon) {
      setPolygons(polygons.filter(p => p.id !== polygonId))
      if (selectedPolygon?.id === polygonId) {
        setSelectedPolygon(null)
      }
    }
  }

  const startEditing = (polygon: PolygonData) => {
    setEditingId(polygon.id)
    setEditingName(polygon.name)
  }

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      setPolygons(prev => 
        prev.map(p => 
          p.id === editingId 
            ? { ...p, name: editingName.trim() }
            : p
        )
      )
      
      // Update selected polygon if it's being edited
      if (selectedPolygon?.id === editingId) {
        setSelectedPolygon({ ...selectedPolygon, name: editingName.trim() })
      }
    }
    setEditingId(null)
    setEditingName('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  if (polygons.length === 0) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>📊</span>
            <span>Polygon Analysis</span>
          </h3>
          <div className="text-sm text-gray-500">
            0 regions created
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🗺️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No analysis regions yet</h4>
          <p className="text-gray-600 max-w-sm mx-auto">
            Draw polygons on the map to analyze weather data across different regions and compare patterns.
          </p>
          <p className="text-sm text-blue-600 mt-4 font-medium">
            Use the drawing tools on the map to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>📊</span>
          <span>Polygon Analysis</span>
        </h3>
        <div className="text-sm text-gray-500">
          {polygons.length} region{polygons.length !== 1 ? 's' : ''} created
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {polygons.map((polygon, index) => {
          const isSelected = selectedPolygon?.id === polygon.id
          const isEditing = editingId === polygon.id
          const dataSource = dataSources.find(ds => ds.id === polygon.dataSourceId)

          return (
            <div
              key={polygon.id}
              onClick={() => !isEditing && setSelectedPolygon(polygon)}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-600">Region {index + 1}</span>
                </div>
                <div className="flex space-x-1">
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(polygon)
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-300"
                      title="Edit name"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePolygon(polygon.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-300"
                    title="Delete region"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {/* Polygon Name */}
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Enter region name"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveEdit()
                        }}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          cancelEdit()
                        }}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h4 className="font-medium text-gray-900">{polygon.name}</h4>
                )}
                
                {/* Data Source */}
                <div className="text-sm">
                  <span className="text-gray-500">Data Source:</span>
                  <span className="ml-1 font-medium text-gray-700">{dataSource?.name || 'Unknown'}</span>
                </div>
                
                {/* Weather Data Display */}
                <div className="text-sm">
                  <span className="text-gray-500">Current Value:</span>
                  <div className="mt-1">
                    {Object.entries(polygon.data).map(([field, value]) => {
                      const fieldDataSource = dataSources.find(ds => ds.field === field)
                      const unit = fieldDataSource?.unit || ''
                      return (
                        <div key={field} className="font-mono text-lg font-bold text-gray-900">
                          {value !== null && value !== undefined && !isNaN(value as number)
                            ? `${(value as number).toFixed(1)}${unit}`
                            : 'N/A'}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    Selected
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
