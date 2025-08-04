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
    polygons: true,
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

  const SectionHeader = ({ title, count, isExpanded, onToggle, icon }: {
    title: string
    count?: number
    isExpanded: boolean
    onToggle: () => void
    icon: string
  }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
          {count !== undefined && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {count}
            </span>
          )}
        </h3>
      </div>
      <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Data Sources Section */}
      <div>
        <SectionHeader
          title="Data Sources"
          isExpanded={expandedSections.dataSources}
          onToggle={() => toggleSection('dataSources')}
          icon="📊"
        />
        
        {expandedSections.dataSources && (
          <div className="mt-4 space-y-4">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className={`group relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                  source.isActive
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-750 hover:border-blue-300 dark:hover:border-blue-500'
                }`}
                onClick={() => updateActiveDataSource(source.id)}
              >
                {/* Active indicator */}
                {source.isActive && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                        {source.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Unit: {source.unit}
                        </span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {source.field}
                        </span>
                      </div>
                    </div>
                    {source.isActive && (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Color Rules */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🎨 Color Rules</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
                    </div>
                    
                    <div className="space-y-2">
                      {source.thresholds.map((threshold, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <select
                            className="px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-16 flex-shrink-0"
                            value={threshold.operator}
                            onChange={(e) => updateThreshold(source.id, index, 'operator', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="=">=</option>
                            <option value="<">&lt;</option>
                            <option value=">">&gt;</option>
                            <option value="<=">≤</option>
                            <option value=">=">≥</option>
                          </select>
                          
                          <input
                            type="number"
                            className="px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-16 flex-shrink-0"
                            value={threshold.value}
                            onChange={(e) => updateThreshold(source.id, index, 'value', parseFloat(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="0"
                          />
                          
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <div 
                              className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600 shadow-sm flex-shrink-0"
                              style={{ backgroundColor: threshold.color }}
                              title={`Color: ${threshold.color}`}
                            ></div>
                            <input
                              type="color"
                              className="w-0 h-0 opacity-0 absolute"
                              value={threshold.color}
                              onChange={(e) => updateThreshold(source.id, index, 'color', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              id={`color-${source.id}-${index}`}
                            />
                            <label 
                              htmlFor={`color-${source.id}-${index}`}
                              className="text-xs font-mono text-gray-600 dark:text-gray-400 px-1 py-1 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors truncate flex-1 min-w-0"
                              onClick={(e) => e.stopPropagation()}
                              title={threshold.color.toUpperCase()}
                            >
                              {threshold.color.toUpperCase()}
                            </label>
                          </div>
                          
                          {source.thresholds.length > 1 && (
                            <button
                              className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded transition-all duration-200 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeThreshold(source.id, index)
                              }}
                              title="Remove threshold"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg transition-all duration-200 hover:border-solid flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          addThreshold(source.id)
                        }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Color Rule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Polygons Section */}
      <div>
        <SectionHeader
          title="Polygons"
          count={polygons.length}
          isExpanded={expandedSections.polygons}
          onToggle={() => toggleSection('polygons')}
          icon="📐"
        />
        
        {expandedSections.polygons && (
          <div className="mt-4">
            {polygons.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No polygons yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Draw polygons on the map to analyze data</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                        </div>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePolygon(polygon.id)
                        }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Data Values */}
                    <div className="space-y-1">
                      {Object.entries(polygon.data).map(([field, value]) => {
                        const unit = dataSources.find(ds => ds.field === field)?.unit || ''
                        return (
                          <div key={field} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-300">{field}:</span>
                            <span className="font-mono font-medium text-gray-900 dark:text-white">
                              {value !== null ? value.toFixed(2) : 'N/A'} 
                              {unit && <span className="text-gray-500 ml-1">{unit}</span>}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Polygon Details */}
      {selectedPolygon && (
        <div>
          <SectionHeader
            title="Polygon Details"
            isExpanded={expandedSections.details}
            onToggle={() => toggleSection('details')}
            icon="🔍"
          />
          
          {expandedSections.details && (
            <div className="mt-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {selectedPolygon.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Data Source: {dataSources.find(ds => ds.id === selectedPolygon.dataSourceId)?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Current Values</h5>
                    <div className="space-y-2">
                      {Object.entries(selectedPolygon.data).map(([field, value]) => {
                        const unit = dataSources.find(ds => ds.field === field)?.unit || ''
                        return (
                          <div key={field} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field}</span>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                              {value !== null ? value.toFixed(2) : 'N/A'} 
                              {unit && <span className="text-gray-500 ml-1">{unit}</span>}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-gray-800 dark:from-gray-800 dark:to-gray-750 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💡</span>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Quick Guide</h4>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Draw polygons using the map tools</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Select data sources to change colors</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Configure color rules for visualization</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span>Click polygons to view detailed data</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar