'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Download } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Label } from '@repo/ui/label'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateExport } from '@/lib/graphql-hooks/export'
import { ExportExportMode, ExportExportType } from '@repo/codegen/src/schema.ts'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type ExportEvidenceDialogProps = {
  trigger?: React.ReactNode
}

const ExportEvidenceDialog: React.FC<ExportEvidenceDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [mode, setMode] = useState<ExportExportMode>(ExportExportMode.FOLDER)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createExport, isPending: isSubmitting } = useCreateExport()

  const handleExport = async () => {
    try {
      await createExport({
        input: {
          exportType: ExportExportType.EVIDENCE,
          mode,
        },
      })
      successNotification({
        title: 'Evidence export started',
        description: 'Your evidence export has been started. You can check the status in the exports page.',
      })
      setIsOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger className="bg-transparent" disabled={isSubmitting}>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="transparent" icon={<Download />} className="h-8 px-2!" iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Export
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[480px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Export Evidence</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Export Mode</Label>
            <RadioGroup value={mode} className="flex flex-col gap-3" onValueChange={(val) => setMode(val as ExportExportMode)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value={ExportExportMode.FOLDER} id="export-folder" className="mt-0.5" />
                <Label htmlFor="export-folder" className="font-normal cursor-pointer">
                  <span>Folder</span>
                  <p className="text-xs text-muted-foreground">Export all evidences as a zip file in which each export is organized into folders and grouped by the control</p>
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value={ExportExportMode.FLAT} id="export-flat" className="mt-0.5" />
                <Label htmlFor="export-flat" className="font-normal cursor-pointer">
                  <span>Flat</span>
                  <p className="text-xs text-muted-foreground">Export all evidence as a zip file</p>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={handleExport} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Exporting...' : 'Export'}
            </Button>
            <CancelButton onClick={() => setIsOpen(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ExportEvidenceDialog }
