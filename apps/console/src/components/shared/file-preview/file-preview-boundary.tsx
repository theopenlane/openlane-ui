'use client'

import React from 'react'
import { Download, FileWarning } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ErrorBoundary } from '@repo/ui/error-boundary'
import type { File as GqlFile } from '@repo/codegen/src/schema'
import FilePreview from './file-preview'

type PreviewFile = Pick<GqlFile, 'presignedURL' | 'providedFileName' | 'providedFileExtension' | 'detectedMimeType'>

type Props = { file: PreviewFile }

const FilePreviewBoundary: React.FC<Props> = ({ file }) => (
  <ErrorBoundary fallback={<PreviewFallback file={file} />} resetKey={file.presignedURL}>
    <FilePreview file={file} />
  </ErrorBoundary>
)

const PreviewFallback: React.FC<Props> = ({ file }) => (
  <div className="flex flex-col items-center gap-3 rounded-md border border-muted bg-muted/40 p-6 text-sm">
    <FileWarning className="h-6 w-6 text-destructive" />
    <div className="text-center">
      <p className="font-medium">Couldn’t load preview.</p>
      <p className="text-muted-foreground">{file.providedFileName}</p>
      <p className="mt-2 text-xs text-muted-foreground">The file may be unavailable from this environment. Try downloading it instead.</p>
    </div>
    {file.presignedURL && (
      <Button asChild variant="secondary">
        <a href={file.presignedURL} download={file.providedFileName}>
          <Download className="h-4 w-4" />
          Download
        </a>
      </Button>
    )}
  </div>
)

export default FilePreviewBoundary
