'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import ImportControlsDialogFramework from './program-settings-import-controls-dialog-framework'
import ImportControlsDialogProgram from './program-settings-import-controls-dialog-program'
import { SelectedItem } from '../shared/program-settings-import-controls-shared-props'

const ImportControlsDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [selectedImportControlsFrom, setSelectedImportControlsFrom] = useState<ObjectEnum>(ObjectEnum.STANDARD)
  // const { successNotification, errorNotification } = useNotification()

  const handleImport = async () => {
    // try {
    // } catch (error) {}
    // setSelectedItems([])
    // setSelectedImportControlsFrom(ObjectEnum.STANDARD)
  }

  const handleBack = async () => {
    setSelectedItems([])
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
          <ImportControlsDialogFramework setSelectedItems={setSelectedItems} selectedItems={selectedItems} />
        ) : (
          <ImportControlsDialogProgram setSelectedItems={setSelectedItems} selectedItems={selectedItems} />
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
