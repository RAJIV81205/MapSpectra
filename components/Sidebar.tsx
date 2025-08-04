'use client'

import React, { useState } from 'react'
import { DataSource, PolygonData } from '@/types'

interface SidebarProps {
  dataSources: DataSource[]
  setDataSources: React.Dispatch<React.SetStateAction<DataSource[]>>
  polygons: PolygonData[]
  setPolygons: React.Dispatch<React.SetStateAction<PolygonData[]>>
  selectedPolygon: PolygonData | null
  setSelectedPolygon: React.Dispatch<React.SetStateAction<PolygonData | null>>
}

const Sidebar: React.FC<SidebarProps> = ({
  dataSources,
  setDataSources,
  polygons,
  setPolygons,
  selectedPolygon,
  setSelectedPolygon
}) => {
  const [expandedSections, setExpandedSections] = useState({
    dataSources: true,
    details: true
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateActiveDataSource = (sourceId: string) => {
    setDataSources((prev: DataSource[]) =>
      prev.map(ds => ({ ...ds, isActive: ds.id === sourceId }))
    )
  }

  const updateThreshold = (sourceId: string, thresholdIndex: number, field: string, value: any) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? {
              ...source,
              thresholds: source.thresholds.map((threshold, index) =>
                index === thresholdIndex
                  ? { ...threshold, [field]: value }
                  : threshold
              )
            }
          : source
      )
    )
  }

  const addThreshold = (sourceId: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? {
              ...source,
              thresholds: [
                ...source.thresholds,
                { operator: '>=', value: 0, color: '#3B82F6' }
              ]
            }
          : source
      )
    )
  }

  const removeThreshold = (sourceId: string, thresholdIndex: number) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? {
              ...source,
              thresholds: source.thresholds.filter((_, index) => index !== thresholdIndex)
            }
          : source
      )
    )
  }

  const SectionHeader = ({ title, count, isExpanded, onToggle, icon }: {
    title: string
    count?: number
    isExpanded: boolean
    onToggle: () => void
    icon: string
  }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
    >
      <div className="flex items-center space-x-2">
        <span>{icon}</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
            {count}
          </span>
        )}
      </div>
      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
        ↓
      </span>
    </button>
  )

  return (
    <div className="space-y-4 p-4">
      {/* Data Sources Section */}
      
        
        
        {expandedSections.dataSources && (
          <div className="p-3 space-y-3">
            {dataSources.map((source) => (
              <div key={source.id} className="space-y-3">
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    source.isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => updateActiveDataSource(source.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Active indicator */}
                      {source.isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">{source.name}</h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Unit: {source.unit} • {source.field}
                        </div>
                      </div>
                    </div>
                    {source.isActive && (
                      <div className="text-blue-500 text-sm">Active</div>
                    )}
                  </div>

                  {/* Color Rules */}
                  {source.isActive && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                        <span>🎨</span>
                        <span>Color Rules</span>
                      </div>
                      
                      {source.thresholds.map((threshold, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <select
                            value={threshold.operator}
                            onChange={(e) => updateThreshold(source.id, index, 'operator', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          >
                            <option value=">=">&gt;=</option>
                            <option value=">">&gt;</option>
                            <option value="<=">&lt;=</option>
                            <option value="<">&lt;</option>
                            <option value="=">=</option>
                          </select>
                          
                          <input
                            type="number"
                            value={threshold.value}
                            onChange={(e) => updateThreshold(source.id, index, 'value', parseFloat(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-16 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            placeholder="0"
                          />
                          
                          <input
                            type="color"
                            value={threshold.color}
                            onChange={(e) => updateThreshold(source.id, index, 'color', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-6 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                            id={`color-${source.id}-${index}`}
                          />
                          
                          <div
                            className="px-2 py-1 rounded text-white text-xs font-medium min-w-16 text-center"
                            style={{ backgroundColor: threshold.color }}
                            onClick={(e) => e.stopPropagation()}
                            title={threshold.color.toUpperCase()}
                          >
                            {threshold.color.toUpperCase()}
                          </div>
                          
                          {source.thresholds.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeThreshold(source.id, index)
                              }}
                              className="text-red-500 hover:text-red-700 px-1"
                              title="Remove threshold"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addThreshold(source.id)
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 mt-2"
                      >
                        + Add Color Rule
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
     

      {/* Selected Polygon Details */}
      {selectedPolygon && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader
            title="Selected Polygon"
            isExpanded={expandedSections.details}
            onToggle={() => toggleSection('details')}
            icon="🔍"
          />
          
          {expandedSections.details && (
            <div className="p-3 space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{selectedPolygon.name}</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Data Source: {dataSources.find(ds => ds.id === selectedPolygon.dataSourceId)?.name}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Values</h5>
                <div className="space-y-2">
                  {Object.entries(selectedPolygon.data).map(([field, value]) => {
                    const dataSource = dataSources.find(ds => ds.field === field)
                    const unit = dataSource?.unit || ''
                    
                    return (
                      <div key={field} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {dataSource?.name || field}
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions Footer */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Guide</h5>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Draw polygons using the map tools</li>
          <li>• Select data sources to change colors</li>
          <li>• Configure color rules for visualization</li>
          <li>• Click polygons to view detailed data</li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
