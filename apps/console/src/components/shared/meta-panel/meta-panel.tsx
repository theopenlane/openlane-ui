import React from 'react'
import { Panel } from '@repo/ui/panel'
import { LucideProps } from 'lucide-react'
import { format } from 'date-fns'

type MetaPanelEntry = {
  icon: React.ElementType<LucideProps>
  label: string
  value: string | React.ReactNode
}

type MetaPanelProps = {
  entries: MetaPanelEntry[]
}

export const formatTime = (str: string) => (str ? format(str, 'h:mm bbb. MMMM d, yyyy') : '')

export const MetaPanel: React.FC<MetaPanelProps> = ({ entries }) => {
  return (
    <Panel className="py-1">
      <div className="flex flex-col divide-y divide-border">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-start py-3">
            <div className="w-36 min-w-36 flex items-center gap-2">
              <entry.icon size={16} className="text-[--color-button]" />
              <span className="font-bold">{entry.label}</span>
            </div>
            <div>{entry.value}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
