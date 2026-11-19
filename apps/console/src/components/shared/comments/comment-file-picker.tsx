import React, { useRef } from 'react'
import { Paperclip, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { acceptedFileTypes, acceptedFileTypesShort, maxFileSizeInMb } from '@/components/shared/file-upload/file-upload-config'
import { useNotification } from '@/hooks/useNotification'
import { formatFileSize, formatList } from '@/utils/strings'

const MAX_FILE_SIZE_BYTES = maxFileSizeInMb * 1024 * 1024
const ACCEPT = acceptedFileTypes.join(',')

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

type TCommentFilePickerProps = {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export const CommentFilePicker: React.FC<TCommentFilePickerProps> = ({ files, onChange, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { errorNotification } = useNotification()

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''

    const wrongType = selected.filter((file) => !acceptedFileTypes.includes(file.type))
    const tooLarge = selected.filter((file) => !wrongType.includes(file) && file.size > MAX_FILE_SIZE_BYTES)
    const reasons = [
      wrongType.length > 0 && `${formatList(wrongType.map((file) => file.name))} cannot be attached. Accepted: ${acceptedFileTypesShort.join(', ')}.`,
      tooLarge.length > 0 && `${formatList(tooLarge.map((file) => file.name))} ${tooLarge.length === 1 ? 'exceeds' : 'exceed'} the ${maxFileSizeInMb} MB limit.`,
    ].filter((reason): reason is string => !!reason)
    if (reasons.length > 0) {
      errorNotification({ title: 'Some files were not attached', description: reasons.join(' ') })
    }

    const stagedKeys = new Set(files.map(fileKey))
    const accepted = selected.filter((file) => !wrongType.includes(file) && !tooLarge.includes(file) && !stagedKeys.has(fileKey(file)))
    if (accepted.length > 0) onChange([...files, ...accepted])
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={handleSelect} />
      <Button type="button" variant="icon" size="icon-sm" disabled={disabled} descriptiveTooltipText="Attach files" onClick={() => inputRef.current?.click()}>
        <Paperclip />
      </Button>
      {files.map((file) => (
        <span key={fileKey(file)} className="flex min-w-0 max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-sm">
          <TruncatedCell className="min-w-0 max-w-48" portal>
            {file.name}
          </TruncatedCell>
          <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
          <Button type="button" variant="icon" size="icon-xs" disabled={disabled} descriptiveTooltipText={`Remove ${file.name}`} onClick={() => onChange(files.filter((staged) => staged !== file))}>
            <X />
          </Button>
        </span>
      ))}
    </div>
  )
}
