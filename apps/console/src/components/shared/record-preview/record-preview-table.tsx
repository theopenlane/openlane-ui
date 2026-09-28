'use client'

import React from 'react'
import { GripVertical } from 'lucide-react'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type UniqueIdentifier } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { cn } from '@repo/ui/lib/utils'

export type TRecordPreviewReorder = {
  rowIds: string[]
  itemLabel: string
  onMoveRow: (from: number, to: number) => void
}

type TRecordPreviewTableProps = {
  headers: string[]
  rows: string[][]
  ariaLabel: string
  caption?: React.ReactNode
  emptyMessage?: string
  className?: string
  reorder?: TRecordPreviewReorder
}

const PreviewCells: React.FC<{ headers: string[]; row: string[] }> = ({ headers, row }) =>
  headers.map((_, cellIndex) => {
    const value = row[cellIndex] ?? ''
    return (
      <TableCell key={cellIndex} compact className="max-w-80 truncate whitespace-nowrap" title={value}>
        {value}
      </TableCell>
    )
  })

const SortablePreviewRow = React.memo(({ id, headers, row, position, itemLabel }: { id: string; headers: string[]; row: string[]; position: number; itemLabel: string }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <TableRow compact ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={isDragging ? 'relative z-10 bg-card shadow-md' : undefined}>
      <TableCell compact className="w-8">
        <Button
          type="button"
          variant="icon"
          size="icon-sm"
          ref={setActivatorNodeRef}
          aria-label={`Reorder ${itemLabel} ${position}`}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </Button>
      </TableCell>
      <TableCell compact className="w-10 tabular-nums text-muted-foreground">
        {position}
      </TableCell>
      <PreviewCells headers={headers} row={row} />
    </TableRow>
  )
})

SortablePreviewRow.displayName = 'SortablePreviewRow'

const ReorderContext: React.FC<{ reorder: TRecordPreviewReorder; children: React.ReactNode }> = ({ reorder: { rowIds, itemLabel, onMoveRow }, children }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const positionOf = (id: UniqueIdentifier) => rowIds.indexOf(String(id)) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${itemLabel} ${positionOf(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${itemLabel} ${positionOf(active.id)} is over position ${positionOf(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `${itemLabel} ${positionOf(active.id)} was moved to position ${positionOf(over.id)}.` : `${itemLabel} ${positionOf(active.id)} was dropped.`),
    onDragCancel: ({ active }) => `Moving ${itemLabel} ${positionOf(active.id)} was cancelled.`,
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = rowIds.indexOf(String(active.id))
    const to = rowIds.indexOf(String(over.id))
    if (from !== -1 && to !== -1) onMoveRow(from, to)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} accessibility={{ announcements }} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  )
}

const SortableBody: React.FC<{ headers: string[]; rows: string[][]; reorder: TRecordPreviewReorder }> = ({ headers, rows, reorder: { rowIds, itemLabel } }) => (
  <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
    <TableBody>
      {rows.map((row, rowIndex) => (
        <SortablePreviewRow key={rowIds[rowIndex]} id={rowIds[rowIndex]} headers={headers} row={row} position={rowIndex + 1} itemLabel={itemLabel} />
      ))}
    </TableBody>
  </SortableContext>
)

export const RecordPreviewTable = React.memo(({ headers, rows, ariaLabel, caption, emptyMessage = 'Nothing to preview.', className, reorder }: TRecordPreviewTableProps) => {
  if (headers.length === 0 || rows.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const table = (
    <Table compact containerClassName="min-h-0 flex-1" aria-label={ariaLabel} className="w-max min-w-full">
      <TableHeader>
        <TableRow compact>
          {reorder && (
            <>
              <TableHead compact scope="col" className="w-8">
                <span className="sr-only">Reorder</span>
              </TableHead>
              <TableHead compact scope="col" className="w-10 whitespace-nowrap font-medium text-foreground">
                #
              </TableHead>
            </>
          )}
          {headers.map((header, index) => (
            <TableHead key={index} compact scope="col" className="whitespace-nowrap font-medium text-foreground" title={header}>
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      {reorder ? (
        <SortableBody headers={headers} rows={rows} reorder={reorder} />
      ) : (
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} compact>
              <PreviewCells headers={headers} row={row} />
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  )

  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden', className)}>
      {reorder ? <ReorderContext reorder={reorder}>{table}</ReorderContext> : table}
      {caption && <div className="shrink-0 border-t px-4 py-2.5 text-xs text-muted-foreground">{caption}</div>}
    </div>
  )
})

RecordPreviewTable.displayName = 'RecordPreviewTable'
