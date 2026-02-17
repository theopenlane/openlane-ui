import React from 'react'
import { CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import ObjectsChip from '../objects-chip/objects-chip'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { useRouter } from 'next/navigation'
import { Info, SlidersHorizontal } from 'lucide-react'

type TObjectAssociationProgramsChipsProps = {
  refMap: string[]
  setRefMap: React.Dispatch<React.SetStateAction<string[]>>
  form: CreateEvidenceFormMethods
}

const ObjectAssociationProgramsChips: React.FC<TObjectAssociationProgramsChipsProps> = ({ refMap, setRefMap, form }: TObjectAssociationProgramsChipsProps) => {
  const router = useRouter()
  const handleRemove = (id: string) => {
    const idx = form.getValues('programIDs')?.indexOf(id)
    if (idx === undefined || idx === -1) return

    const newIds = form.getValues('programIDs')?.filter((x) => x !== id) || []
    const newRefCodes = refMap.filter((_, i) => i !== idx) || []
    form.setValue('programIDs', newIds)
    setRefMap(newRefCodes)
  }

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {(form.getValues('programIDs') || []).map((id, i) => {
          const href = getHrefForObjectType('programs', {
            id,
          })
          return (
            <TooltipProvider key={id}>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.preventDefault()} asChild>
                  <ObjectsChip removable onRemove={() => handleRemove(id)} name={refMap[i] ?? id} objectType={'programs'} />
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="flex flex-row gap-4 items-center border-b pb-2 pt-2">
                      <div className="flex items-center gap-1">
                        <SlidersHorizontal size={12} />
                        <span className="font-medium">Name</span>
                      </div>
                      <span className={`text-brand pl-3 cursor-pointer`} onClick={() => handleNavigate(href)}>
                        {refMap[i] ?? id}
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
