'use client'

import React, { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlControlStatus, ControlControlType } from '@repo/codegen/src/schema'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ControlStatusOptions, ControlControlTypeOptions } from '@/components/shared/enum-mapper/control-enum'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Option } from '@repo/ui/multiple-selector'
import { SearchableSingleSelect } from '../authority-card'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { ClientError } from 'graphql-request'
import { useBulkEditControl } from '@/lib/graphql-hooks/controls'

type BulkEditControlsDialogProps = {
  selectedControls: { id: string; refCode: string }[]
  setIsBulkEditing: React.Dispatch<React.SetStateAction<boolean>>
}

interface BulkEditControlDialogFormValues {
  controlOwnerID: string
  status: ControlControlStatus
  controlType?: ControlControlType
}

const defaultObject = {
  controlOwnerID: '',
  status: ControlControlStatus.NOT_IMPLEMENTED,
  controlType: ControlControlType.CORRECTIVE,
}

const bulkEditControlsSchema = z.object({
  controlOwnerID: z.string().optional(),
  controlType: z.nativeEnum(ControlControlType).optional(),
  status: z.nativeEnum(ControlControlStatus).optional(),
})

export const BulkEditControlsDialog: React.FC<BulkEditControlsDialogProps> = ({ selectedControls, setIsBulkEditing }) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { errorNotification, successNotification } = useNotification()
  const form = useForm<BulkEditControlDialogFormValues>({
    resolver: zodResolver(bulkEditControlsSchema),
    defaultValues: defaultObject,
  })
  const { data } = useGetAllGroups({ where: {} })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []
  const options: Option[] = groups.map((g) => ({
    label: g?.name || '',
    value: g?.id || '',
  }))
  const { control, handleSubmit } = form

  const onSubmit = async (values: BulkEditControlDialogFormValues) => {
    const ids = selectedControls.map((control) => control.id)

    if (ids.length === 0) return
    try {
      await bulkEditControl({
        ids: ids,
        input: {
          ...(values.controlOwnerID === '' ? { clearControlOwner: true } : { controlOwnerID: values.controlOwnerID }),
          status: values.status,
          controlType: values.controlType,
        },
      })
      successNotification({
        title: 'Successfully bulk updated selected controls.',
      })
      setIsBulkEditing(false)
      setOpen(false)
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to bulk edit control. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <FormProvider {...form}>
        <DialogTrigger asChild>
          <Button disabled={selectedControls.length === 0} icon={<Pencil />} iconPosition="left" variant="outline">
            {selectedControls && selectedControls.length > 0 ? `Bulk Edit (${selectedControls.length})` : 'Bulk Edit'}
          </Button>
        </DialogTrigger>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[497px]">
            <DialogHeader>
              <DialogTitle>Bulk edit</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex justify-items items-center gap-2">
                <Label className="min-w-36">Control owner</Label>
                <SearchableSingleSelect fieldName={'controlOwnerID'} options={options} placeholder={`Select control owner`} autoFocus />
              </div>
              <div className="flex justify-items items-center gap-2">
                <Label className="min-w-36">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-60">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ControlStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex justify-items items-center gap-2">
                <Label className="min-w-36">Control type</Label>
                <Controller
                  name="controlType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-60">
                        <SelectValue placeholder="Select control type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ControlControlTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-2">
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </FormProvider>
    </Dialog>
  )
}
