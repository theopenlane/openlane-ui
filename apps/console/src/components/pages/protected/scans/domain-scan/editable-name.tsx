'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@repo/ui/input'

interface EditableNameProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const EditableName: React.FC<EditableNameProps> = ({ value, onChange, placeholder, className }) => {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const valueBeforeEditRef = useRef(value)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const startEditing = () => {
    valueBeforeEditRef.current = value
    setEditing(true)
  }

  const cancelEditing = () => {
    onChange(valueBeforeEditRef.current)
    setEditing(false)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setEditing(false)
            return
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            cancelEditing()
          }
        }}
        className={className}
      />
    )
  }

  return (
    <span
      onClick={(event) => {
        event.stopPropagation()
        startEditing()
      }}
      className={`cursor-pointer decoration-dotted hover:underline ${!value ? 'text-muted-foreground' : ''} ${className ?? ''}`}
    >
      {value || placeholder}
    </span>
  )
}
