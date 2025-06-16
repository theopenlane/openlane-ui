'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useCloneControls } from '@/lib/graphql-hooks/standards'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { useGetAllPrograms } from '@/lib/graphql-hooks/programs'
import { useOrganization } from '@/hooks/useOrganization'

type SelectedControl = { id: string; refCode: string }

type AddToOrganizationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedControls?: SelectedControl[] | null
  standardId?: string
  standardName?: string
}

const AddToOrganizationDialog: React.FC<AddToOrganizationDialogProps> = ({ open, onOpenChange, selectedControls, standardId, standardName }) => {
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>(undefined)
  const { currentOrgId } = useOrganization()
  const { data: programsData } = useGetAllPrograms()
  const { mutateAsync: cloneControls, isPending } = useCloneControls()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const controlIDs = useMemo(() => selectedControls?.map((c) => c.id) ?? [], [selectedControls])

  const programs = useMemo(() => {
    return programsData?.programs?.edges?.map((edge) => edge?.node) || []
  }, [programsData])

  const handleAddToOrg = async () => {
    try {
      await cloneControls({
        input: {
          ownerID: currentOrgId,
          programID: selectedProgram,
          ...(standardId ? { standardID: standardId } : { controlIDs }),
        },
      })

      queryClient.invalidateQueries({ queryKey: ['controls'] })

      successNotification({ title: 'Controls added to organization successfully!' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Failed to add controls to the organization.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add to Organization</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {selectedControls ? (
            <div>
              <p className="font-semibold">Selected controls ({selectedControls.length})</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedControls.map(({ refCode }) => (
                  <span key={refCode} className="text-sm text-primary border-b border-dotted border-current whitespace-nowrap">
                    {refCode}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">Add all controls from ({standardName})</div>
          )}
          <div>
            <label className="font-semibold block mb-2">Assign to program</label>
            <Select onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="No program (add later)" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program?.id} value={program?.id ?? ''}>
                    {program?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm mt-2">Assigning controls to a program helps you track ownership, testing, and evidence. You can skip this for now and assign it later.</p>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={handleAddToOrg} disabled={isPending} className="min-w-[100px]">
            {isPending ? 'Adding...' : 'Add'}
          </Button>
          <Button type="button" variant="back" onClick={() => onOpenChange(false)} className="min-w-[100px]">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddToOrganizationDialog
