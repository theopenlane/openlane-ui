'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Separator } from '@repo/ui/separator'
import { SectionCard } from '../../shared/section-card'
import { SelectionRow } from '../../shared/selection-row'
import { SelectAllCheckbox } from '../../shared/select-all-checkbox'
import { toggleSetValue } from '../../shared/selection-utils'
import { ShowAllFooter, useShowAll } from '../components/show-all-footer'

const INITIAL_VISIBLE_ROWS = 25

export type SelectableRow = {
  title: React.ReactNode
  description?: React.ReactNode
  badges?: string[]
  leading?: React.ReactNode
  alreadyAdded?: boolean
}

type SelectableListStepProps<T extends { id: string }> = {
  title: string
  description: string
  noun: string
  items: T[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  renderRow: (item: T) => SelectableRow
}

export const SelectableListStep = <T extends { id: string }>({ title, description, noun, items, selected, setSelected, renderRow }: SelectableListStepProps<T>) => {
  const { visible: visibleItems, hiddenCount, expand } = useShowAll(items, INITIAL_VISIBLE_ROWS)

  return (
    <SectionCard
      title={title}
      description={description}
      titleAction={<SelectAllCheckbox ids={items.map((item) => item.id)} selected={selected} setSelected={setSelected} />}
      footer={hiddenCount > 0 ? <ShowAllFooter summary={`Showing ${visibleItems.length} of ${items.length} ${noun}`} onShowAll={expand} /> : undefined}
    >
      {visibleItems.map((item, index) => {
        const row = renderRow(item)

        return (
          <React.Fragment key={item.id}>
            <div className="py-2">
              <SelectionRow
                checked={selected.has(item.id)}
                onCheckedChange={() => toggleSetValue(setSelected, item.id)}
                title={row.title}
                description={row.description}
                badges={row.badges}
                leading={row.leading}
                trailing={row.alreadyAdded ? <Badge variant="secondary">Already added</Badge> : undefined}
              />
            </div>
            {index < visibleItems.length - 1 ? <Separator separatorClass="bg-border" /> : null}
          </React.Fragment>
        )
      })}
    </SectionCard>
  )
}
