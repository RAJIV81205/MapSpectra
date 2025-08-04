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
    <div
      onClick={onToggle}
      className="flex items-center justify-between p-3 bg-black text-white cursor-pointer hover:bg-gray-800 border-b-2 border-gray-600"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-black text-sm uppercase">{title}</span>
        {count !== undefined && (
          <span className="bg-yellow-400 text-black px-2 py-1 rounded-none font-black text-xs">
            {count}
          </span>
        )}
      </div>
      <span className="text-xl font-black">{isExpanded ? '−' : '+'}</span>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto">
      <SectionHeader
        title="Data Sources"
        count={dataSources.filter(ds => ds.isActive).length}
        isExpanded={expandedSections.dataSources}
        onToggle={() => toggleSection('dataSources')}
        icon="📊"
      />

      {expandedSections.dataSources && (
        <div className="p-3 space-y-3">
          {dataSources.map((source) => (
            <div
              key={source.id}
              className={`border-4 border-black p-3 cursor-pointer transition-all ${
                source.isActive
                  ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => updateActiveDataSource(source.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                {source.isActive && (
                  <span className="text-green-600 font-black text-lg">●</span>
                )}
                {source.isActive ? (
                  <span className="font-black text-lg">{source.name}</span>
                ) : (
                  <span className="font-bold text-gray-600">{source.name}</span>
                )}
              </div>
              {source.isActive ? (
                <div className="text-sm font-bold">
                  Unit: {source.unit} • {source.field}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Unit: {source.unit} • {source.field}
                </div>
              )}

              {/* Color Rules - Compact inline layout */}
              {source.isActive && (
                <div className="mt-3">
                  <div className="text-xs font-black uppercase mb-2">Color Rules</div>
                  {source.thresholds.map((threshold, index) => (
                    <div key={index} className="flex items-center gap-1 mb-2 text-xs">
                      <select
                        value={threshold.operator}
                        onChange={(e) => updateThreshold(source.id, index, 'operator', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-2 border-black px-2 py-1 bg-white text-black font-bold font-mono text-sm"
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
                        className="border-2 border-black px-2 py-1 w-16 bg-white text-black font-bold font-mono text-sm"
                        placeholder="0"
                      />
                      <input
                        type="color"
                        value={threshold.color}
                        onChange={(e) => updateThreshold(source.id, index, 'color', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 border-2 border-black cursor-pointer"
                        id={`color-${source.id}-${index}`}
                        title={threshold.color.toUpperCase()}
                      />
                      {source.thresholds.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeThreshold(source.id, index)
                          }}
                          className="bg-red-500 text-white px-2 py-1 border-2 border-black font-black hover:bg-red-600 text-sm"
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
                    className="bg-green-500 text-white px-3 py-1 border-2 border-black font-black text-xs uppercase hover:bg-green-600 mt-2"
                  >
                    + Add Color Rule
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      
    </div>
  )
}

export default Sidebar
