'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import { ExternalLink, LayoutGrid } from 'lucide-react'

export type SubprocessorMode = 'manage' | 'link'

type TProps = {
  value: SubprocessorMode
  onChange: (mode: SubprocessorMode) => void
}

type TOption = {
  mode: SubprocessorMode
  icon: React.ReactNode
  selectedTitle: string
  unselectedTitle: string
  description: string
  note: string
}

const options: TOption[] = [
  {
    mode: 'manage',
    icon: <LayoutGrid size={18} />,
    selectedTitle: 'Managed in Openlane',
    unselectedTitle: 'Switch to manage in Openlane',
    description: 'Add and update subprocessors here. Embed the list on your site using a snippet.',
    note: 'Embed snippet available to paste into your website',
  },
  {
    mode: 'link',
    icon: <ExternalLink size={18} />,
    selectedTitle: 'Managed on external page',
    unselectedTitle: 'Switch to external page',
    description: 'You already maintain a subprocessors page elsewhere. Customers will be sent there instead.',
    note: 'Customers are redirected — no list shown here',
  },
]

const SubprocessorsModeToggle: React.FC<TProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-3 mb-6">
      <div>
        <p className="text-sm font-medium">Where do you manage your subprocessors list?</p>
        <p className="text-sm text-muted-foreground">Choose how customers see your subprocessors</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
        {options.map((option) => {
          const selected = value === option.mode
          return (
            <Card
              key={option.mode}
              role="button"
              tabIndex={0}
              onClick={() => onChange(option.mode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(option.mode)
                }
              }}
              className={cn('cursor-pointer p-4 flex flex-col gap-2 transition-colors', selected ? 'border-brand ring-1 ring-brand' : 'border-border hover:border-brand')}
            >
              <div className="flex items-center gap-2">
                <span className="text-brand">{option.icon}</span>
                <span className="font-medium">{selected ? option.selectedTitle : option.unselectedTitle}</span>
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{option.note}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default SubprocessorsModeToggle
