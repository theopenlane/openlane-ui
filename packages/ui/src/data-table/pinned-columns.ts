export const SELECT_COLUMN_ID = 'select'
export const ROW_ACTIONS_COLUMN_ID = 'actions'

export const isPinnedColumnId = (id: string): boolean => id === SELECT_COLUMN_ID || id === ROW_ACTIONS_COLUMN_ID

const pinRank = (id: string): number => (id === SELECT_COLUMN_ID ? -1 : id === ROW_ACTIONS_COLUMN_ID ? 1 : 0)

export const sortPinnedColumns = <TColumn>(columns: TColumn[], getColumnId: (column: TColumn) => string): TColumn[] => [...columns].sort((a, b) => pinRank(getColumnId(a)) - pinRank(getColumnId(b)))

export const reconcileColumnOrder = (storedOrder: string[]): string[] => {
  if (storedOrder.length === 0) return storedOrder

  return [SELECT_COLUMN_ID, ...storedOrder.filter((id) => !isPinnedColumnId(id))]
}
