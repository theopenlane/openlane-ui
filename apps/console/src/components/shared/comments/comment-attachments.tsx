import React from 'react'
import { Download, Eye, Paperclip } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { canOpenFilePreviewDialog } from '@/components/shared/file-preview/preview-mime'
import { fileDownload } from '@/components/shared/lib/export'
import { useNotification } from '@/hooks/useNotification'
import { type TCommentFile } from '@/lib/graphql-hooks/entity-comments'
import { formatFileSize } from '@/utils/strings'

type TCommentAttachmentsProps = {
  files: TCommentFile[]
  onPreview: (file: TCommentFile) => void
}

export const CommentAttachments: React.FC<TCommentAttachmentsProps> = ({ files, onPreview }) => {
  const { errorNotification } = useNotification()

  return (
    <ul className="mt-2 flex flex-wrap gap-2" aria-label="Attachments">
      {files.map((file) => {
        const downloadUrl = file.presignedURL
        return (
          <li key={file.id} className="flex min-w-0 max-w-full items-center gap-2 rounded-md border bg-card px-2 py-1 text-sm">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <TruncatedCell className="min-w-0 max-w-64" portal>
              {file.providedFileName}
            </TruncatedCell>
            {!!file.providedFileSize && <span className="shrink-0 text-muted-foreground">{formatFileSize(file.providedFileSize)}</span>}
            {canOpenFilePreviewDialog(file) && (
              <Button type="button" variant="icon" size="icon-xs" descriptiveTooltipText={`View ${file.providedFileName}`} onClick={() => onPreview(file)}>
                <Eye />
              </Button>
            )}
            {downloadUrl && (
              <Button
                type="button"
                variant="icon"
                size="icon-xs"
                descriptiveTooltipText={`Download ${file.providedFileName}`}
                onClick={() => fileDownload(downloadUrl, file.providedFileName, errorNotification)}
              >
                <Download />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
