import React from 'react'

export const SummaryCard: React.FC<{ title: string; value: string; hint: string }> = ({ title, value, hint }) => (
  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="mt-2 text-2xl">{value}</p>
    <p className="mt-1 font-mono text-xs text-muted-foreground">{hint}</p>
  </div>
)
