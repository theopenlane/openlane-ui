'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import ImportControlsDialogFramework from './program-settings-import-controls-dialog-framework'
import ImportControlsDialogProgram from './program-settings-import-controls-dialog-program'
import { SelectedItem } from '../shared/program-settings-import-controls-shared-props'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCloneControls } from '@/lib/graphql-hooks/standard'
import { useGetProgramBasicInfo } from '@/lib/graphql-hooks/program'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const ImportControlsDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
  const [selectedFrameworkIds, setSelectedFrameworkIds] = useState<string[]>([])
  const [selectedImportControlsFrom, setSelectedImportControlsFrom] = useState<ObjectTypes>(ObjectTypes.STANDARD)
  const { successNotification, errorNotification } = useNotification()
  const { id } = useParams<{ id: string }>()

  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync: cloneControls } = useCloneControls()
  const { data: basicInfoData } = useGetProgramBasicInfo(id)
  const handleImport = async () => {
    try {
      await cloneControls({
        input: {
          programID: id,
          controlIDs: selectedItems.map((item) => item.id),
        },
      })

      queryClient.invalidateQueries({ queryKey: ['controls'] })
      successNotification({
        title: 'Controls Imported',
        description: `${selectedItems.length} control(s) successfully imported to the program.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
    handleResetState()
  }

  const handleBack = async () => {
    handleResetState()
  }

  const handleResetState = () => {
    setSelectedItems([])
    setSelectedProgramIds([])
    setSelectedFrameworkIds([])
    setSelectedImportControlsFrom(ObjectTypes.STANDARD)
    setOpen(false)
  }

  if (!id) {
    router.replace('/programs')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {basicInfoData?.program.status !== ProgramProgramStatus.ARCHIVED && (
          <Button variant="secondary" className="w-fit">
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-2xl ">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold leading-8">Import Controls</DialogTitle>
        </DialogHeader>
        <p className="text-sm font-medium leading-5">Import controls from</p>
        <Select value={selectedImportControlsFrom} onValueChange={(val) => setSelectedImportControlsFrom(val as ObjectTypes)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ObjectTypes.STANDARD}>Framework</SelectItem>
            <SelectItem value={ObjectTypes.PROGRAM}>Program</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm font-medium leading-5">Type</p>
        {basicInfoData?.program.status !== ProgramProgramStatus.ARCHIVED &&
          (selectedImportControlsFrom === ObjectTypes.STANDARD ? (
            <ImportControlsDialogFramework
              setSelectedItems={setSelectedItems}
              selectedItems={selectedItems}
              selectedFrameworkIds={selectedFrameworkIds}
              setSelectedFrameworkIds={setSelectedFrameworkIds}
            />
          ) : (
            <ImportControlsDialogProgram setSelectedItems={setSelectedItems} selectedItems={selectedItems} selectedProgramIds={selectedProgramIds} setSelectedProgramIds={setSelectedProgramIds} />
          ))}

        <DialogFooter className="mt-6 flex gap-2">
          <Button onClick={handleImport} disabled={selectedItems.length === 0}>
            {selectedItems.length === 0 ? 'Import' : `Import (${selectedItems.length})`}
          </Button>
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportControlsDialog
