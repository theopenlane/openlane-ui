import { Plus, SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'

export const CreateBtn = (
  <Button variant="primary" className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
    Create
  </Button>
)

export const CreateBtnIcon = (
  <Button variant="primary" className={`p-1 rounded-md h-8 w-8 items-center justify-center flex`}>
    <Plus size={16} />
  </Button>
)

export const prettifyEnum = (key: string) => {
  return key
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export const enumToOptions = <T extends Record<string, string>>(e: T, labels?: Partial<Record<T[keyof T], string>>) => {
  return Object.entries(e).map(([key, value]) => ({
    value,
    label: labels?.[value as T[keyof T]] ?? prettifyEnum(key),
  }))
}

export const getEnumLabel = (value: string | undefined): string => {
  if (!value) return ''

  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
