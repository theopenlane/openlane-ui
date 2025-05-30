'use client'

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Popover, PopoverContent } from '@repo/ui/popover'
import { Command, CommandItem, CommandList, CommandEmpty } from '@repo/ui/command'
import { Input } from '@repo/ui/input'
import { useState, useRef, useEffect } from 'react'
import { useControlSelect } from '@/lib/graphql-hooks/controls'
import { PopoverTrigger } from '@radix-ui/react-popover'

export default function SetParentControlDialog() {
  const [selectedControlId, setSelectedControlId] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const { controlOptions, isLoading } = useControlSelect({
    where: search ? { refCodeContainsFold: search } : undefined,
  })

  const selectedLabel = controlOptions.find((opt) => opt.value === selectedControlId)?.label

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  console.log('search', search)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">Set Parent</Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Set parent control</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Label>Select Control</Label>

          <div className="relative w-full">
            <Input
              ref={inputRef}
              role="combobox"
              value={search}
              placeholder="Search refCode..."
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value)
                setOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
              }}
            />

            <Popover open={open}>
              <PopoverTrigger className="h-0 absolute" />
              <PopoverContent align="start" className="absolute z-50  w-[334px] p-0">
                <Command shouldFilter={false}>
                  <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    {controlOptions.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        onSelect={() => {
                          setSelectedControlId(opt.value)
                          console.log('setSearch', opt.label)
                          setSearch(opt.label)
                          setOpen(false)
                        }}
                      >
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button
            onClick={() => {
              console.log('Parent control set:', selectedControlId)
            }}
            disabled={!selectedControlId}
          >
            Add
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
