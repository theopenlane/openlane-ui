'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'

const CATEGORY_OPTIONS = ['Availability', 'Confidentiality', 'Processing Integrity', 'Privacy']

export default function SOC2CategoryStep() {
  const { watch, setValue } = useFormContext<{ categories: string[] }>()

  const selected = watch('categories') || []

  const toggleCategory = (cat: string) => {
    if (selected.includes(cat)) {
      setValue(
        'categories',
        selected.filter((c) => c !== cat),
      )
    } else {
      setValue('categories', [...selected, cat])
    }
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Pick Trust Service Categories</h2>
        <p className="text-sm text-muted-foreground">Security is always required. Add others now or later.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-7">
        {CATEGORY_OPTIONS.map((item) => {
          const isSelected = selected.includes(item)
          return (
            <Button key={item} type="button" onClick={() => toggleCategory(item)} className={`text-left h-11 ${isSelected ? 'shadow-primary24 border border-primary' : ''}`}>
              {item}
            </Button>
          )
        })}
      </div>
    </>
  )
}
