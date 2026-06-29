import * as React from 'react'

import type { TElement, TTableCellElement, TTableElement } from 'platejs'

import { BaseTablePlugin } from '@platejs/table'
import { SlateElement, type SlateElementProps } from 'platejs/static'

import { cn } from '@repo/ui/lib/utils'

export function TableElementStatic({ children, ...props }: SlateElementProps<TTableElement>) {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin)
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft

  const colSizes = props.element.colSizes ?? []
  const firstRow = props.element.children[0] as TElement | undefined
  const columnCount = colSizes.length > 0 ? colSizes.length : (firstRow?.children?.length ?? 0)
  const resolvedColSizes = colSizes.length > 0 ? colSizes.map((colSize) => colSize || 120) : Array.from({ length: columnCount }, () => 120)
  const colSizesTotal = resolvedColSizes.reduce((total, colSize) => total + colSize, 0)

  return (
    <SlateElement {...props} className="overflow-x-auto py-5" style={{ paddingLeft: marginLeft }}>
      <div className="group/table relative w-full">
        <table className="mr-0 ml-px table h-px table-fixed border-collapse" style={{ maxWidth: '100%', width: '100%' }}>
          {resolvedColSizes.length > 0 && (
            <colgroup>
              {resolvedColSizes.map((colSize, index) => (
                <col
                  key={index}
                  style={{
                    width: colSizesTotal > 0 ? `${(colSize / colSizesTotal) * 100}%` : `${100 / resolvedColSizes.length}%`,
                  }}
                />
              ))}
            </colgroup>
          )}
          <tbody className="min-w-full">{children}</tbody>
        </table>
      </div>
    </SlateElement>
  )
}

export function TableRowElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} as="tr" className="h-full">
      {props.children}
    </SlateElement>
  )
}

export function TableCellElementStatic({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean
}) {
  const { editor, element } = props
  const { api } = editor.getPlugin(BaseTablePlugin)

  const { minHeight } = api.table.getCellSize({ element })
  const borders = api.table.getCellBorders({ element })

  return (
    <SlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left font-normal *:m-0',
        'before:size-full',
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders &&
          cn(
            borders.bottom?.size && `before:border-b before:border-b-border`,
            borders.right?.size && `before:border-r before:border-r-border`,
            borders.left?.size && `before:border-l before:border-l-border`,
            borders.top?.size && `before:border-t before:border-t-border`,
          ),
      )}
      style={
        {
          '--cellBackground': element.background,
          backgroundColor: element.background,
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
      }}
    >
      <div className="relative z-20 box-border h-full px-4 py-2" style={{ minHeight }}>
        {props.children}
      </div>
    </SlateElement>
  )
}

export function TableCellHeaderElementStatic(props: SlateElementProps<TTableCellElement>) {
  return <TableCellElementStatic {...props} isHeader />
}
