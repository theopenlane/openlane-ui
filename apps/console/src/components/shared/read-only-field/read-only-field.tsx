import React from 'react'

type TReadOnlyFieldProps = {
  label: string
  children?: React.ReactNode
}

export const ReadOnlyField: React.FC<TReadOnlyFieldProps> = ({ label, children }) => {
  const isEmpty = children === undefined || children === null || children === ''

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm">{isEmpty ? '—' : children}</div>
    </div>
  )
}
