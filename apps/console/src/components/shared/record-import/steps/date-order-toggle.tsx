'use client'

import React, { useId } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { DATE_ORDER_LABELS, DATE_ORDER_SHORT_LABELS, DATE_ORDERS, type TDateOrder } from '@/utils/loose-date'

type TDateOrderToggleProps = {
  order: TDateOrder
  columnHeader: string
  onChange: (order: TDateOrder) => void
}

export const DateOrderToggle: React.FC<TDateOrderToggleProps> = ({ order, columnHeader, onChange }) => {
  const labelId = useId()
  const selectOrder = (value: string) => {
    const next = DATE_ORDERS.find((candidate) => candidate === value)
    if (next) onChange(next)
  }

  return (
    <div className="flex flex-col gap-1">
      <span id={labelId} className="text-xs text-muted-foreground">
        Date order
      </span>
      <Tabs value={order} onValueChange={selectOrder} variant="solid">
        <TabsList className="w-fit" aria-labelledby={labelId} aria-description={`How "${columnHeader}" dates like 4/5 are read`}>
          {DATE_ORDERS.map((candidate) => (
            <TabsTrigger key={candidate} value={candidate} title={DATE_ORDER_LABELS[candidate]}>
              {DATE_ORDER_SHORT_LABELS[candidate]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
