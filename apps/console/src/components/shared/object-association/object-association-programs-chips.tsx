import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import ObjectsChip from '../objects-chip/objects-chip'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { useRouter } from 'next/navigation'
import { Info, SlidersHorizontal } from 'lucide-react'
import { type TLinkedProgram } from './types/object-association-types'

type TObjectAssociationProgramsChipsProps = {
  programs: TLinkedProgram[]
  onChange: (programs: TLinkedProgram[]) => void
}

const ObjectAssociationProgramsChips: React.FC<TObjectAssociationProgramsChipsProps> = ({ programs, onChange }: TObjectAssociationProgramsChipsProps) => {
  const router = useRouter()

  const handleRemove = (id: string) => {
    onChange(programs.filter((program) => program.id !== id))
  }

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  if (programs.length === 0) {
    return <p className="text-sm text-muted-foreground">No programs linked yet</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {programs.map(({ id, name }) => {
          const href = getHrefForObjectType('programs', {
            id,
          })
          return (
            <TooltipProvider key={id}>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.preventDefault()} asChild>
                  <ObjectsChip removable onRemove={() => handleRemove(id)} name={name} objectType={'programs'} />
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                      <div className="flex items-center gap-1">
                        <SlidersHorizontal size={12} />
                        <span className="font-medium">Name</span>
                      </div>
                      <span className={`text-brand pl-3 cursor-pointer`} onClick={() => handleNavigate(href)}>
                        {name}
                      </span>
                    </div>
                    <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                      <div className="flex items-center gap-1">
                        <Info size={12} />
                        <span className="font-medium">Type</span>
                      </div>
                      <span className="cursor-pointer break-words">{'Program'}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}

export default ObjectAssociationProgramsChips
