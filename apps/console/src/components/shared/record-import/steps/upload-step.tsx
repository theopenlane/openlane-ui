'use client'

import React, { useState } from 'react'
import { ArrowRight, FileSpreadsheet, Scissors, Sparkles, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Callout } from '@/components/shared/callout/callout'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import { useNotification } from '@/hooks/useNotification'
import { formatFileSize, pluralizeWithCount } from '@/utils/strings'
import { MAX_IMPORT_FILE_SIZE_MB, parseDelimitedFile } from '../lib/delimited-file'
import type { TDestinationField, TParsedDelimitedFile } from '../lib/types'

type TUploadStepProps = {
  entityLabel: string
  parsed: TParsedDelimitedFile | null
  onFileParsed: (parsed: TParsedDelimitedFile | null) => void
  requiredFields: TDestinationField[]
  onOpenFieldReference: () => void
}

export const UploadStep: React.FC<TUploadStepProps> = ({ entityLabel, parsed, onFileParsed, requiredFields, onOpenFieldReference }) => {
  const { errorNotification } = useNotification()
  const [isParsing, setIsParsing] = useState(false)

  const handleUploadedFile = async (uploaded: TUploadedFile) => {
    if (!uploaded.file) return

    setIsParsing(true)
    try {
      const next = await parseDelimitedFile(uploaded.file)
      if (!next) {
        errorNotification({ title: 'Nothing to import', description: 'We could not find a header row in that file.' })
        return
      }
      onFileParsed(next)
    } catch {
      errorNotification({ title: 'Could not read that file', description: 'The file could not be parsed as CSV. Please try again later.' })
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-lg border bg-card p-6">
        {parsed ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileSpreadsheet className="shrink-0 text-primary" size={24} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{parsed.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {pluralizeWithCount(parsed.rows.length, 'row')} · {pluralizeWithCount(parsed.headers.length, 'column')} · {formatFileSize(parsed.fileSize)}
                </p>
              </div>
              <Badge variant="green">Parsed</Badge>
              <Button variant="icon" size="icon-sm" aria-label="Remove file" onClick={() => onFileParsed(null)}>
                <X size={16} />
              </Button>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">Detected columns</p>
              <div className="flex flex-wrap gap-2">
                {parsed.headers.map((header, index) => (
                  <Badge key={`${header}-${index}`} variant="outline" className="font-mono">
                    {header}
                  </Badge>
                ))}
              </div>
            </div>

            {parsed.rows.length === 0 && (
              <Callout variant="warning" compact title="No data rows">
                This file has a header row but nothing under it, so there is nothing to import.
              </Callout>
            )}

            {parsed.malformed && (
              <Callout variant="warning" compact title="Some rows do not line up with the header">
                {parsed.raggedRowCount > 0
                  ? `${pluralizeWithCount(parsed.raggedRowCount, 'row')} ${parsed.raggedRowCount === 1 ? 'does' : 'do'} not have ${pluralizeWithCount(parsed.headers.length, 'value')} — their values may land in the wrong fields. Check the preview on the last step before importing.`
                  : 'Some rows could not be parsed cleanly — check the preview on the last step before importing.'}
              </Callout>
            )}
          </div>
        ) : (
          <FileUpload
            acceptedFileTypes={['text/csv', 'application/vnd.ms-excel']}
            acceptedFileTypesShort={['CSV']}
            maxFileSizeInMb={MAX_IMPORT_FILE_SIZE_MB}
            onFileUpload={handleUploadedFile}
            multipleFiles={false}
            acceptedFilesClass="flex justify-between text-sm"
          />
        )}

        {isParsing && <p className="mt-3 text-sm text-muted-foreground">Reading your file…</p>}

        <Callout variant="simple" className="mt-4">
          Upload the file you already have. Openlane reads the header row and matches your columns to {entityLabel} fields in the next step.
        </Callout>
      </div>

      <aside className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium">What gets imported</h3>
        <ul className="flex flex-col gap-4 text-sm">
          <li className="flex gap-3">
            <Sparkles className="mt-0.5 shrink-0 text-primary" size={16} />
            <div>
              <p>{requiredFields.length === 0 ? 'No required fields' : pluralizeWithCount(requiredFields.length, 'required field')}</p>
              <p className="text-xs text-muted-foreground">
                {requiredFields.length === 0
                  ? `Every ${entityLabel.toLowerCase()} field is optional — map whichever columns you have.`
                  : `${new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(requiredFields.map((field) => field.label))} must come from a column in your file. Everything else is optional.`}
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <ArrowRight className="mt-0.5 shrink-0 text-primary" size={16} />
            <div>
              <p>Automatic matching</p>
              <p className="text-xs text-muted-foreground">Exact names, normalized names, and known aliases are matched for you.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Scissors className="mt-0.5 shrink-0 text-primary" size={16} />
            <div>
              <p>Extra columns are fine</p>
              <p className="text-xs text-muted-foreground">Anything Openlane does not support can be ignored — no need to delete it.</p>
            </div>
          </li>
        </ul>
        <Button variant="transparent" className="mt-4 px-0 text-blue-500 hover:underline" onClick={onOpenFieldReference}>
          View the {entityLabel} field reference →
        </Button>
      </aside>
    </div>
  )
}
