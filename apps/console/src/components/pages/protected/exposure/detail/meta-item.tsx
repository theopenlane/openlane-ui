import React from 'react'

export const MetaItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex min-h-6 items-center gap-2 text-sm">{children}</div>
  </div>
)
