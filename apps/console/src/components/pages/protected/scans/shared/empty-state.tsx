import React from 'react'

export const EmptyState = ({ message }: { message: string }) => (
  <div className="px-6 py-5">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
)
