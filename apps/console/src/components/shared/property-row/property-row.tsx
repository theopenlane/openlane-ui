import React from 'react'

type TPropertyRowProps = {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}

export const PropertyRow: React.FC<TPropertyRowProps> = ({ icon, label, children }) => (
  <div className="grid grid-cols-[160px_1fr] items-start gap-x-3 border-b border-border pb-3">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{icon}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="group relative min-w-0 text-sm break-words">{children}</div>
  </div>
)
