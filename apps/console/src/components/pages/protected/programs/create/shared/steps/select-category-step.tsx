'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { AlertCircle } from 'lucide-react'

const CATEGORY_OPTIONS = ['Security', 'Availability', 'Confidentiality', 'Processing Integrity', 'Privacy']

export default function SelectCategoryStep() {
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

  const showWarning = selected.length === 0

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Add Trust Service Categories</h2>
        <p className="text-sm text-muted-foreground">Security is automatically included. Add additional categories to expand your SOC 2 coverage.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-7">
        {CATEGORY_OPTIONS.map((item, index) => {
          const isSelected = selected.includes(item)
          const isLastOdd = CATEGORY_OPTIONS.length % 2 !== 0 && index === CATEGORY_OPTIONS.length - 1

          return (
            <Button
              key={item}
              type="button"
              variant="outline"
              onClick={() => toggleCategory(item)}
              className={`text-left h-11 transition-all ${isSelected ? 'shadow-primary24 border border-primary bg-primary/10' : ''} ${isLastOdd ? 'col-span-2 justify-self-center w-1/2' : ''}`}
            >
              {item}
            </Button>
          )
        })}
      </div>

      {showWarning && (
        <div className="mt-5 flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <p>No categories selected — no controls will be imported.</p>
        </div>
      )}
    </>
  )
}
