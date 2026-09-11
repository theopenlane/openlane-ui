'use client'

import { Check, IdCardLanyard, User } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { CommandItem } from '@repo/ui/command'
import { type PersonnelOption } from '@/lib/graphql-hooks/identity-holder'

interface PersonnelOptionItemProps {
  option: PersonnelOption
  isSelected: boolean
  onSelect: () => void
}

export const PersonnelOptionItem: React.FC<PersonnelOptionItemProps> = ({ option, isSelected, onSelect }) => {
  const showEmail = Boolean(option.email) && option.email !== option.label

  return (
    <CommandItem value={`personnel-${option.value}`} onSelect={onSelect} className="items-start">
      <IdCardLanyard className="mt-0.5 mr-2 h-4 w-4" />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate">{option.label}</span>
          {option.isOpenlaneUser && (
            <Badge variant="select" className="gap-1 shrink-0 max-w-2/5 overflow-hidden px-1.5 py-0 font-normal" title="Has an Openlane account">
              <User className="size-3!" />
              User
            </Badge>
          )}
        </div>
        {showEmail && <span className="truncate text-xs text-muted-foreground">{option.email}</span>}
      </div>
      {isSelected && <Check className="mt-0.5 ml-auto h-4 w-4" />}
    </CommandItem>
  )
}
