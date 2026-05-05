'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Copy, InfoIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'
import { type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { type EditPersonnelFormData } from './hooks/use-form-schema'

type EmailAliasesFieldProps = {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  internalEditing: string | null
  setInternalEditing: (name: string | null) => void
  handleUpdate?: (input: UpdateIdentityHolderInput) => Promise<void>
  label?: string
  tooltipContent?: string
  labelClassName?: string
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const { successNotification, errorNotification } = useNotification()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      successNotification({ title: 'Copied', description: `"${value}" copied to clipboard.` })
    } catch {
      errorNotification({ title: 'Copy failed', description: 'Clipboard access is not available in this context.' })
    }
  }

  return (
    <button type="button" onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      <Copy size={13} />
    </button>
  )
}

export const EmailAliasesField: React.FC<EmailAliasesFieldProps> = ({
  isEditing,
  isEditAllowed,
  isCreate = false,
  internalEditing,
  setInternalEditing,
  handleUpdate,
  label = 'Email Aliases',
  tooltipContent = 'Alternate email addresses for this person',
  labelClassName,
}) => {
  const { control } = useFormContext<EditPersonnelFormData>()
  const [input, setInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const isFieldEditing = isCreate || isEditing || internalEditing === 'emailAliases'

  useEffect(() => {
    if (internalEditing !== 'emailAliases') return
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setInternalEditing(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [internalEditing, setInternalEditing])

  const enterEdit = () => {
    if (!isEditing && isEditAllowed) setInternalEditing('emailAliases')
  }

  return (
    <div className="flex flex-col" ref={containerRef}>
      <div className="flex items-center gap-1">
        <label className={cn('text-sm', labelClassName)}>{label}</label>
        <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={tooltipContent} />
      </div>
      <Controller
        control={control}
        name="emailAliases"
        render={({ field }) => {
          const values: string[] = Array.isArray(field.value) ? field.value : []

          const addAlias = () => {
            const trimmed = input.trim()
            if (!trimmed || values.includes(trimmed)) return
            const next = [...values, trimmed]
            field.onChange(next)
            if (handleUpdate) handleUpdate({ emailAliases: next })
            setInput('')
          }

          const removeAlias = (email: string) => {
            const next = values.filter((v) => v !== email)
            field.onChange(next)
            if (handleUpdate) handleUpdate({ emailAliases: next })
          }

          if (isFieldEditing) {
            return (
              <div className="flex flex-wrap items-center gap-2 py-2">
                {values.map((value) => (
                  <span key={value} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                    {value}
                    <button type="button" onClick={() => removeAlias(value)} className="ml-1 bg-transparent text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </span>
                ))}
                <Input
                  type="email"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === 'Tab') && input) {
                      e.preventDefault()
                      addAlias()
                    }
                  }}
                  placeholder="Add email and press Enter"
                  autoFocus={internalEditing === 'emailAliases'}
                  className="flex-1 min-w-[160px] bg-transparent"
                />
              </div>
            )
          }

          return (
            <div className="text-sm py-2 rounded-md cursor-pointer px-1 hover:bg-accent" onClick={enterEdit}>
              {values.length === 0 ? (
                <span className="text-muted-foreground italic">Not set</span>
              ) : (
                <div className="flex flex-col gap-1">
                  {values.map((alias) => (
                    <div key={alias} className="flex items-center gap-2">
                      <span>{alias}</span>
                      <CopyButton value={alias} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}
