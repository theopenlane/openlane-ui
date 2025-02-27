import React from 'react'
import { Panel } from '@repo/ui/panel'
import { LucideProps } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@repo/ui/lib/utils'

export type MetaPanelEntry = {
  icon: React.ElementType<LucideProps>
  label: string
  value: string | React.ReactNode
  align?: 'top' | 'middle'
}

type MetaPanelProps = {
  entries: MetaPanelEntry[]
}

export const formatTime = (str: string) => (str ? format(str, 'h:mm bbb. MMMM d, yyyy') : '')

export const MetaPanel: React.FC<MetaPanelProps> = ({ entries }) => {
  const getAlignment = (align: string | undefined) => {
    switch (align) {
      case 'top':
        return 'items-start'
      default:
        return 'items-center'
    }
  }

  return (
    <Panel className="py-1">
      <div className="flex flex-col divide-y divide-border">
        {entries.map((entry) => (
          <div key={entry.label} className={cn('flex py-3', getAlignment(entry.align))}>
            <div className="w-32 min-w-32 flex items-center gap-2">
              <entry.icon size={16} className="text-brand" />
              <span className="font-bold">{entry.label}</span>
            </div>
            <div className="grow">{entry.value}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
