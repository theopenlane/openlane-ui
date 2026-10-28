import React from 'react'

export const ReadOnlyRow: React.FC<{ icon?: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex shrink-0 items-center gap-2">
      {icon}
      <span className="text-base text-muted-foreground">{label}</span>
    </div>
    <span className="min-w-0 px-1 py-2 text-right text-sm break-words">{children}</span>
  </div>
)
