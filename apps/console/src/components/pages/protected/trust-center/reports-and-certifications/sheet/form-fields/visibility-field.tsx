'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import { TrustCenterDocTrustCenterDocumentVisibility } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

interface Props {
  isEditing: boolean
}

export const VisibilityField = ({ isEditing }: Props) => {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext()

  const visibilityValue: string = watch('visibility')

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <Label>Visibility</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon size={14} className="mx-1 cursor-pointer inline text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-sm text-left">
              <p className="mb-1">
                <strong>Not Visible:</strong> This document is not published to your public Trust Center.
              </p>
              <p className="mb-1">
                <strong>Private:</strong> Published, but access requires an approved NDA before download.
              </p>
              <p>
                <strong>Public:</strong> Published and available for anyone to view or download in your Trust Center.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isEditing ? (
        <>
          <Select
            onValueChange={(val) =>
              setValue('visibility', val as TrustCenterDocTrustCenterDocumentVisibility, {
                shouldValidate: true,
              })
            }
            value={visibilityValue || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              {enumToOptions(TrustCenterDocTrustCenterDocumentVisibility).map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.visibility && <p className="text-red-500 text-sm mt-1">{String(errors.visibility.message)}</p>}
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1 capitalize">{visibilityValue?.split('_').join(' ').toLowerCase() || '—'}</p>
      )}
    </div>
  )
}
