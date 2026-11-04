'use client'

import React, { useId } from 'react'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Separator } from '@repo/ui/separator'
import { Textarea } from '@repo/ui/textarea'

type ImportedRecordCardProps = {
  title: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  alreadyAdded?: boolean
  children: React.ReactNode
}

export const ImportedRecordCard = ({ title, checked, onCheckedChange, alreadyAdded, children }: ImportedRecordCardProps) => {
  const checkboxId = useId()

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Checkbox id={checkboxId} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
          <label htmlFor={checkboxId} className="truncate text-base font-semibold">
            {title}
          </label>
        </div>
        <div className="flex items-center gap-2">
          {alreadyAdded ? <Badge variant="secondary">Already added</Badge> : null}
          <Badge variant="primary" className="font-mono uppercase tracking-wide">
            Source · Imported
          </Badge>
        </div>
      </div>
      {checked ? (
        <>
          <Separator separatorClass="bg-border" />
          <div className="space-y-4 px-6 py-4">
            {alreadyAdded ? <p className="text-sm text-muted-foreground">This is already in Openlane. The import links the selected vendors and assets to it instead of creating a copy.</p> : null}
            {children}
          </div>
        </>
      ) : null}
    </Card>
  )
}

type RecordFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  error?: string
}

export const RecordField = ({ label, value, onChange, multiline = false, error }: RecordFieldProps) => {
  const id = useId()
  const errorId = useId()
  const fieldProps = { id, value, 'aria-invalid': !!error, 'aria-describedby': error ? errorId : undefined }

  return (
    <div className="min-w-0 space-y-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {multiline ? <Textarea {...fieldProps} onChange={(event) => onChange(event.target.value)} /> : <Input {...fieldProps} onChange={(event) => onChange(event.target.value)} />}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
