import React from 'react'

export const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-6 border-b py-2.5 text-sm last:border-b-0">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right break-words">{value || <span className="text-muted-foreground italic">Not set</span>}</dd>
  </div>
)
