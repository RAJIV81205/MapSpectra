// types/index.ts
export interface TimeRange {
    start: Date
    end: Date
    mode: 'single' | 'range'
    currentHour: number
  }
  
  export interface Threshold {
    operator: '=' | '<' | '>' | '<=' | '>='
    value: number
    color: string
  }
  
  export interface DataSource {
    id: string
    name: string
    field: string
    unit: string
    isActive: boolean
    thresholds: Threshold[]
  }
  
  export interface PolygonData {
    id: string
    layer: any // Leaflet layer object
    dataSourceId: string
    data: { [field: string]: number | null }
    name: string
  }
  