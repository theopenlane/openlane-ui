import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { Option } from '@repo/ui/multiple-selector'
import { useRef, useState } from 'react'

interface SearchableSingleSelectProps {
  value?: string
  placeholder?: string
  options: Option[]
  onChange?: (val: string) => void
  autoFocus?: boolean
  onClose?: () => void
  className?: string
}

export const SearchableSingleSelect = ({ value, placeholder = 'Select an option...', options, onChange, autoFocus, onClose, className }: SearchableSingleSelectProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useClickOutsideWithPortal(() => onClose?.(), {
    refs: { triggerRef, popoverRef },
  })

  useEscapeKey(() => onClose?.())

  const selected = options.find((opt) => opt.value === value)

  return (
    <div ref={triggerRef} className={`w-[200px] ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="w-full flex text-sm h-10 px-3 !py-0 justify-between border bg-input rounded-md items-center cursor-pointer" onClick={() => setOpen(true)}>
            <span className="truncate">{selected?.label || placeholder}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent ref={popoverRef} className="w-[200px] p-0 !bg-input border" side="bottom">
          <Command shouldFilter autoFocus={autoFocus}>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange?.(option.value)
                      setOpen(false)
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
