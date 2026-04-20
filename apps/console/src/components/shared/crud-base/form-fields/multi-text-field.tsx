'use client'

import React, { useState } from 'react'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon, ExternalLink } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

interface MultiStringFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  placeholder?: string
  internalEditing: string | null
  setInternalEditing: (field: string | null) => void
  handleUpdate?: (input: { [name: string]: string[] }) => Promise<void>
  className?: string
  error?: string
  tooltipContent?: React.ReactNode
  type?: string
}

export const MultiStringField: React.FC<MultiStringFieldProps> = ({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  placeholder,
  internalEditing,
  setInternalEditing,
  handleUpdate,
  className,
  error,
  tooltipContent,
  type,
}) => {
  const { control, formState } = useFormContext()
  const isFieldEditing = isCreate || isEditing || internalEditing === name

  const [input, setInput] = useState('')

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(name)
    }
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const values: string[] = Array.isArray(field.value) ? field.value : []

        const handleAdd = () => {
          const trimmed = input.trim()
          if (!trimmed || values.includes(trimmed)) return
          const newValues = [...values, trimmed]
          field.onChange(newValues)
          if (!isEditing && !isCreate && handleUpdate) handleUpdate({ [name]: newValues })
          setInput('')
        }

        const handleRemove = (value: string) => {
          const newValues = values.filter((v) => v !== value)
          field.onChange(newValues)
          if (!isEditing && !isCreate && handleUpdate) handleUpdate({ [name]: newValues })
        }

        return (
          <FormItem className={className}>
            <div className="flex items-center gap-1">
              <FormLabel>{label}</FormLabel>
              {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={tooltipContent} />}
            </div>
            <FormControl>
              <div>
                <div className="flex flex-wrap gap-2 rounded-md bg-transparent">
                  {isFieldEditing &&
                    values.map((value) => (
                      <span key={value} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                        {type === 'link' ? (
                          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="">
                            {value.startsWith('http') ? value : `https://${value}`}
                          </a>
                        ) : (
                          value
                        )}
                        <button type="button" onClick={() => handleRemove(value)} className="ml-1 bg-transparent">
                          ×
                        </button>
                      </span>
                    ))}
                  {isFieldEditing && (
                    <Input
                      type="text"
                      value={input}
                      prefix={type === 'link' ? 'https://' : undefined}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === 'Tab') && input) {
                          e.preventDefault()
                          handleAdd()
                        }
                      }}
                      placeholder={placeholder}
                      className="bg-transparent outline-none"
                      autoFocus={internalEditing === name}
                    />
                  )}
                </div>
                {!isFieldEditing && (
                  <div className={`text-sm py-2 rounded-md cursor-pointer px-1 w-full` + (type !== 'link' ? ' hover:bg-accent' : '')} onClick={handleClick}>
                    {values.length === 0 ? (
                      <span className="text-muted-foreground italic">Not set</span>
                    ) : type === 'link' ? (
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => (
                          <a
                            key={value}
                            href={value.startsWith('http') ? value : `https://${value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:bg-accent bg-muted rounded-md px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {value.startsWith('http') ? value : `https://${value}`}
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      values.join(', ')
                    )}
                  </div>
                )}
              </div>
            </FormControl>
            {(error || typeof formState.errors[name]?.message === 'string') && (
              <p className="text-red-500 text-sm">{error || (typeof formState.errors[name]?.message === 'string' ? formState.errors[name]?.message : '')}</p>
            )}
          </FormItem>
        )
      }}
    />
  )
}
