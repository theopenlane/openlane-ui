'use client'

import React from 'react'
import { Download } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import CsvPreview from '@/components/shared/file-preview/csv-preview'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { downloadFile } from '@/utils/downloadFile'
import { useExampleCSV } from './lib/use-example-csv'

type TFieldReferenceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: ObjectTypes
  entityLabel: string
}

export const FieldReferenceDialog: React.FC<TFieldReferenceDialogProps> = ({ open, onOpenChange, entityType, entityLabel }) => {
  const { data: exampleCsv, isLoadingExample, isError, filename } = useExampleCSV(entityType, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1100px,90vw)]">
        <DialogHeader>
          <DialogTitle>{entityLabel} field reference</DialogTitle>
          <DialogDescription>
            Every column the {entityLabel.toLowerCase()} importer accepts, with an example value. You do not need to match this layout — map your own columns in the next step.
          </DialogDescription>
        </DialogHeader>

        {isLoadingExample ? (
          <Skeleton height={220} className="w-full rounded-md" />
        ) : isError || !exampleCsv ? (
          <p className="text-sm text-muted-foreground">The field reference could not be loaded. Please try again later.</p>
        ) : (
          <CsvPreview text={exampleCsv} />
        )}

        <div className="flex justify-end">
          <Button variant="secondary" icon={<Download size={16} />} iconPosition="left" disabled={!exampleCsv} onClick={() => exampleCsv && downloadFile([exampleCsv], `${filename}.csv`, 'text/csv')}>
            Download example CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
