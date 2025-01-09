'use client'
import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Button } from '@repo/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { comboboxStyles } from './combobox-styles'

interface Option {
  value: string
  label: string
}

interface ComboBoxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const ComboBox: React.FC<ComboBoxProps> = ({ options, value, onChange, placeholder = 'Select an option...', className }) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn(comboboxStyles.trigger, className)}>
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <ChevronsUpDown className={comboboxStyles.chevron} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={comboboxStyles.popover}>
        <Command>
          <CommandInput placeholder="Search..." className={comboboxStyles.input} />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  <Check className={cn(comboboxStyles.checkIcon, value === option.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ComboBox
