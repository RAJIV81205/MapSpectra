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
                { operator: '>=', value: 0, color: '#3b82f6' }
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
      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-gray-900">{title}</span>
        {count !== undefined && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            {count}
          </span>
        )}
      </div>
      <svg
        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  return (
    <div className="h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>⚙️</span>
          <span>Data Sources & Controls</span>
        </h2>
      </div>

      {/* Data Sources Section */}
      <div className="border-b border-gray-200">
        <SectionHeader
          title="Data Sources"
          count={dataSources.filter(ds => ds.isActive).length}
          isExpanded={expandedSections.dataSources}
          onToggle={() => toggleSection('dataSources')}
          icon="🌡️"
        />

        {expandedSections.dataSources && (
          <div className="p-4 space-y-4">
            {dataSources.map((source) => (
              <div key={source.id} className="border border-gray-200 rounded-lg">
                <label className="flex items-center p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="dataSource"
                    checked={source.isActive}
                    onChange={() => updateActiveDataSource(source.id)}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{source.name}</span>
                      {source.isActive && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Unit: {source.unit} • Field: {source.field}
                    </div>
                  </div>
                </label>

                {source.isActive && (
                  <div className="px-3 pb-3">
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2">Color Mapping Rules</h4>
                      <div className="space-y-2">
                        {source.thresholds.map((threshold, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <select
                              value={threshold.operator}
                              onChange={(e) => updateThreshold(source.id, index, 'operator', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 transition-all duration-300 hover:border-blue-400 focus:border-blue-500"
                            >
                              <option value=">=">&gt;=</option>
                              <option value=">">&gt;</option>
                              <option value="<=">&lt;=</option>
                              <option value="<">&lt;</option>
                            </select>
                            <input
                              type="number"
                              value={threshold.value}
                              onChange={(e) => updateThreshold(source.id, index, 'value', parseFloat(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 transition-all duration-300 hover:border-blue-400 focus:border-blue-500"
                              placeholder="0"
                            />
                            <input
                              type="color"
                              value={threshold.color}
                              onChange={(e) => updateThreshold(source.id, index, 'color', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer transition-all duration-300 hover:scale-110"
                              title={threshold.color.toUpperCase()}
                            />
                            {source.thresholds.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeThreshold(source.id, index)
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-300"
                                title="Remove threshold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addThreshold(source.id)
                          }}
                          className="w-full py-2 px-3 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-all duration-300 flex items-center justify-center space-x-1"
                        >
                          <span>+</span>
                          <span>Add Color Rule</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50">
        <div className="space-y-2 text-sm">
          <h3 className="font-medium text-gray-900 flex items-center space-x-2">
            <span>💡</span>
            <span>How to use</span>
          </h3>
          <ul className="space-y-1 text-gray-600">
            <li>• Select a data source to activate it</li>
            <li>• Draw polygons on the map to analyze regions</li>
            <li>• Customize color rules to visualize data patterns</li>
            <li>• Use timeline controls to explore different time periods</li>
            <li>• Save and load your analysis regions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
