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
    <button
      onClick={onToggle}
      className="w-full bg-black text-white p-4 border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all font-black uppercase text-left flex items-center justify-between mb-4 font-mono"
    >
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <span className="text-lg">{title}</span>
        {count !== undefined && (
          <span className="bg-yellow-400 text-black px-3 py-1 ml-3 border-2 border-white font-black">
            {count}
          </span>
        )}
      </div>
      <span className="text-2xl">{isExpanded ? '−' : '+'}</span>
    </button>
  )

  return (
    <div className="space-y-4">


      {expandedSections.dataSources && (
        <div className="space-y-4">
          {dataSources.map((source) => (
            <div
              key={source.id}
              className={`border-4 border-black p-4 cursor-pointer transition-all font-mono ${source.isActive
                  ? 'bg-red-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                }`}
              onClick={() => updateActiveDataSource(source.id)}
            >
              <div className="flex items-center justify-between mb-2">
                {source.isActive && (
                  <div className="w-4 h-4 bg-black mr-2"></div>
                )}
                {source.isActive ? (
                  <h3 className="font-black text-lg uppercase">{source.name}</h3>
                ) : (
                  <h3 className="font-black text-black -lg uppercase">{source.name}</h3>
                )}
              </div>

              {source.isActive ? (
                  <p className="text-sm font-bold mb-2">Unit: {source.unit} • {source.field}</p>
                ) : (
                  <p className="text-sm font-bold mb-2 text-black">Unit: {source.unit} • {source.field}</p>
                )}
              

              {/* Color Rules - Compact inline layout */}
              {source.isActive && (
                <div className="mt-4 bg-gray-100 border-2 border-black p-3">
                  <h4 className="font-black text-sm uppercase mb-2">Color Rules</h4>
                  {source.thresholds.map((threshold, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2 bg-white border-2 border-black p-2">
                      <select
                        value={threshold.operator}
                        onChange={(e) => updateThreshold(source.id, index, 'operator', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-2 border-black px-2 py-1 bg-white text-black font-bold font-mono text-sm"
                      >
                        <option value=">=">≥</option>
                        <option value=">">&gt;</option>
                        <option value="<=">&le;</option>
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



      {/* Instructions Footer */}
      <div className="bg-orange-300 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black text-lg uppercase mb-2 font-mono">Quick Guide</h3>
        <ul className="space-y-1 font-bold text-sm font-mono">
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
