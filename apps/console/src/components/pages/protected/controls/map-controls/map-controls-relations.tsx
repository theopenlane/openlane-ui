import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SaveButton } from '@/components/shared/save-button/save-button'
import Slider from '@/components/shared/slider/slider'
import { MappedControlMappingType } from '@repo/codegen/src/schema'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'

const relationTypes = [
  { label: 'Equal', value: MappedControlMappingType.EQUAL },
  { label: 'Subset', value: MappedControlMappingType.SUBSET },
  { label: 'Intersection', value: MappedControlMappingType.INTERSECT },
  { label: 'Partial', value: MappedControlMappingType.PARTIAL },
  { label: 'Superset', value: MappedControlMappingType.SUPERSET },
]

const MapControlsRelations = () => {
  const { control, setValue } = useFormContext()
  const router = useRouter()

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label className="block text-sm font-medium">Relation type</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={14} className="mx-1 cursor-pointer inline" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-sm text-left">
                <strong>Equal (EQUAL):</strong> <p>These two control sets are exactly the same. If evidence covers one set, it fully covers the other too—no extra work needed.</p>
                <strong className="mt-2 block ">Superset (SUPERSET):</strong>
                <p>This set includes everything in the other set, plus more. Evidence for the smaller set helps, but you&apos;ll need additional proof for the extra controls.</p>
                <strong className="mt-2 block">Subset (SUBSET):</strong>
                <p>This set is a smaller part of the other. If you&apos;ve gathered evidence for the larger set, it should fully cover this one.</p>
                <strong className="mt-2 block">Intersect (INTERSECT):</strong>
                <p>The sets share some common ground, but also have controls unique to each. Some evidence may apply to both, but you&apos;ll need to review what&apos;s missing.</p>
                <strong className="mt-2 block">Partial (PARTIAL):</strong>
                <p>There&apos;s some overlap, but it&apos;s unclear how much. You&apos;ll likely need to check both sets carefully to avoid gaps in coverage.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Controller
          name="mappingType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Intersection" />
              </SelectTrigger>
              <SelectContent>
                {relationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label className="block text-sm font-medium">Confidence (0–100%)</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={14} className="mx-1 cursor-pointer inline" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-sm text-left">
                <p>
                  How confident we are that this mapping is correct.
                  <br />A higher number means stronger alignment based on definitions, keywords, or past mappings.
                </p>
                <p className="mt-2">
                  <strong>90–100:</strong> Strong match — likely no manual review needed
                </p>
                <p className="mt-1">
                  <strong>60–89:</strong> Moderate match — worth a quick check
                </p>
                <p className="mt-1">
                  <strong>0–59:</strong> Low match — double-check for accuracy
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Controller
          name="confidence"
          control={control}
          render={({ field }) => (
            <div className="flex items-center flex-col">
              <Slider value={field.value ?? 0} onChange={(val) => field.onChange(val)} />
              <p className="text-blue-500 cursor-pointer self-start" onClick={() => setValue('confidence', 0)}>
                Clear
              </p>
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label className="block text-sm font-medium">Relation</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={14} className="mx-1 cursor-pointer inline" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-sm text-left">
                <p>Describes how this set of controls relates to another set — are they the same, overlapping, or one contained in the other?</p>
                <p className="mt-2">This helps determine whether existing evidence or policies can be reused.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Controller name="relation" control={control} render={({ field }) => <Textarea placeholder="Add description..." rows={4} value={field.value ?? ''} onChange={field.onChange} />} />{' '}
      </div>

      <div className="flex justify-end space-x-2">
        <SaveButton />
        <CancelButton onClick={() => router.back()}></CancelButton>
      </div>
    </div>
  )
}

export default MapControlsRelations
