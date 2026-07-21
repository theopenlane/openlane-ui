'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@repo/ui/input'

interface EditableNameProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// click-to-edit single-line counterpart to @repo/ui/textarea's EditableTextarea
export const EditableName: React.FC<EditableNameProps> = ({ value, onChange, placeholder, className }) => {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

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
          if (event.key === 'Enter') setEditing(false)
        }}
        className={className}
      />
    )
  }

  return (
    <span
      onClick={(event) => {
        event.stopPropagation()
        setEditing(true)
      }}
      className={`cursor-pointer decoration-dotted hover:underline ${!value ? 'text-muted-foreground' : ''} ${className ?? ''}`}
    >
      {value || placeholder}
    </span>
  )
}
