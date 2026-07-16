import { useState } from 'react'

type UseControllableOpenParams = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export const useControllableOpen = ({ open, onOpenChange, defaultOpen = false }: UseControllableOpenParams = {}): [boolean, (value: boolean) => void, boolean] => {
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }

  return [isOpen, setOpen, isControlled]
}
