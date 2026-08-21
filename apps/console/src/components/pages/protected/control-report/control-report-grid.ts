type GridColumn = { track: string; min: number }

const GRID_GAP = 12
const GRID_PADDING = 24

const fixed = (width: number): GridColumn => ({ track: `${width}px`, min: width })
const flexible = (min: number, max: number | 'fr'): GridColumn => ({ track: `minmax(${min}px, ${max === 'fr' ? '1fr' : `${max}px`})`, min })

const getColumns = (isCustomView: boolean, isSelectionMode: boolean): GridColumn[] => {
  const columns: GridColumn[] = []
  if (isSelectionMode) columns.push(fixed(20))
  columns.push(fixed(16))
  columns.push(flexible(110, 160))
  columns.push(flexible(180, 'fr'))
  columns.push(flexible(100, 140))
  if (!isCustomView) columns.push(flexible(110, 160))
  columns.push(flexible(100, 140))
  columns.push(flexible(110, 160))
  columns.push(flexible(110, 160))
  return columns
}

export const GRID_ROW_CLASS = 'grid gap-x-3 [&>*]:min-w-0'

export const getGridCols = (isCustomView: boolean, isSelectionMode: boolean): string =>
  getColumns(isCustomView, isSelectionMode)
    .map((column) => column.track)
    .join(' ')

export const getGridMinWidth = (isCustomView: boolean, isSelectionMode: boolean): number => {
  const columns = getColumns(isCustomView, isSelectionMode)
  return columns.reduce((sum, column) => sum + column.min, 0) + GRID_GAP * (columns.length - 1) + GRID_PADDING
}
