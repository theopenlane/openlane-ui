'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import ImportControlsDialogFramework from './program-settings-import-controls-dialog-framework'
import ImportControlsDialogProgram from './program-settings-import-controls-dialog-program'
import { SelectedItem } from '../shared/program-settings-import-controls-shared-props'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

const ImportControlsDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([])
  const [selectedImportControlsFrom, setSelectedImportControlsFrom] = useState<ObjectEnum>(ObjectEnum.STANDARD)
  const { mutateAsync: updateProgram } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const handleImport = async () => {
    if (!programId) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Cannot import without a valid program ID.',
      })
      return
    }

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          addControlIDs: selectedItems.map((item) => item.id),
        },
      })
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      successNotification({
        title: 'Controls Imported',
        description: `${selectedItems.length} control(s) successfully imported to the program.`,
      })
    } catch {
      errorNotification({
        title: 'Failed to Import Controls',
      })
    }
    setSelectedItems([])
    setSelectedProgramIds([])
    setSelectedFrameworkIds([])
    setSelectedImportControlsFrom(ObjectEnum.STANDARD)
  }

  const handleBack = async () => {
    setSelectedItems([])
    setSelectedProgramIds([])
    setSelectedFrameworkIds([])
    setSelectedImportControlsFrom(ObjectEnum.STANDARD)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit">Import</Button>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[497px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold leading-8">Import Controls</DialogTitle>
        </DialogHeader>
        <p className="text-sm font-medium leading-5">Import controls from</p>
        <Select value={selectedImportControlsFrom} onValueChange={(val) => setSelectedImportControlsFrom(val as ObjectEnum)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ObjectEnum.STANDARD}>Framework</SelectItem>
            <SelectItem value={ObjectEnum.PROGRAM}>Program</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm font-medium leading-5">Type</p>
        {selectedImportControlsFrom === ObjectEnum.STANDARD ? (
          <ImportControlsDialogFramework
            setSelectedItems={setSelectedItems}
            selectedItems={selectedItems}
            selectedFrameworkIds={selectedFrameworkIds}
            setSelectedFrameworkIds={setSelectedFrameworkIds}
          />
        ) : (
          <ImportControlsDialogProgram setSelectedItems={setSelectedItems} selectedItems={selectedItems} selectedProgramIds={selectedProgramIds} setSelectedProgramIds={setSelectedProgramIds} />
        )}
        <DialogFooter className="mt-6 flex gap-2">
          <Button onClick={handleImport} disabled={selectedItems.length === 0}>
            {selectedItems.length === 0 ? 'Import' : `Import (${selectedItems.length})`}
          </Button>
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportControlsDialog
