type GridColumn = { track: string; min: number }

const GRID_GAP = 12
const GRID_PADDING = 24

// data columns use minmax tracks so they render at full width when there is
// room but compress before the page needs a horizontal scrollbar
const getColumns = (isCustomView: boolean, isSelectionMode: boolean): GridColumn[] => {
  const columns: GridColumn[] = []
  if (isSelectionMode) columns.push({ track: '20px', min: 20 })
  columns.push({ track: '16px', min: 16 })
  columns.push({ track: '110px', min: 110 })
  columns.push({ track: 'minmax(180px, 1fr)', min: 180 })
  columns.push({ track: 'minmax(100px, 140px)', min: 100 })
  if (!isCustomView) columns.push({ track: 'minmax(110px, 160px)', min: 110 })
  columns.push({ track: 'minmax(100px, 140px)', min: 100 })
  columns.push({ track: 'minmax(110px, 160px)', min: 110 })
  columns.push({ track: 'minmax(110px, 160px)', min: 110 })
  return columns
}

export const getGridCols = (isCustomView: boolean, isSelectionMode: boolean): string =>
  getColumns(isCustomView, isSelectionMode)
    .map((column) => column.track)
    .join(' ')

export const getGridMinWidth = (isCustomView: boolean, isSelectionMode: boolean): number => {
  const columns = getColumns(isCustomView, isSelectionMode)
  return columns.reduce((sum, column) => sum + column.min, 0) + GRID_GAP * (columns.length - 1) + GRID_PADDING
}
