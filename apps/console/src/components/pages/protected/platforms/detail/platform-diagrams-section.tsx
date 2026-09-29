'use client'

import React, { useId, useMemo, useState } from 'react'
import { Download, Expand, Fingerprint, ImagePlus, Replace, Trash2, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'
import { toHumanLabel } from '@/utils/strings'
import { formatDate } from '@/utils/date'
import { useUploadPlatformDiagram, useRemovePlatformDiagram, DIAGRAM_TYPES, type DiagramType, type PlatformDiagram } from '@/lib/graphql-hooks/platform'
import { useGetEvidencesWithFileIds } from '@/lib/graphql-hooks/evidence'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { fileDownload } from '@/components/shared/lib/export'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { imageAcceptedFileTypes, imageAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import MarkAsDiagramEvidenceDialog from './mark-as-diagram-evidence-dialog'
import UnmarkDiagramEvidenceDialog from './unmark-diagram-evidence-dialog'
import Skeleton from '@/components/shared/skeleton/skeleton'

const MAX_DIAGRAM_SIZE_MB = 20

const diagramTypeLabel = (type: DiagramType) => `${toHumanLabel(type)} Diagram`

interface DiagramImageProps {
  src: string
  alt: string
  className: string
}

const DiagramImage: React.FC<DiagramImageProps> = ({ src, alt, className }) => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img src={src} alt={alt} className={className} />
)

interface DiagramUploadedAtProps {
  createdAt: string | null
}

const DiagramUploadedAt: React.FC<DiagramUploadedAtProps> = ({ createdAt }) => (createdAt ? <span className="text-xs text-muted-foreground">Uploaded at: {formatDate(createdAt)}</span> : null)

type StagedDiagramFile = { file: File; url: string; name: string }

interface DiagramUploadDialogProps {
  replacing: PlatformDiagram | null
  replacingHasEvidence: boolean
  onSubmit: (file: File, type: DiagramType) => Promise<boolean>
  onClose: () => void
  isSubmitting: boolean
}

const DiagramUploadDialog: React.FC<DiagramUploadDialogProps> = ({ replacing, replacingHasEvidence, onSubmit, onClose, isSubmitting }) => {
  const [chosenType, setChosenType] = useState<DiagramType | ''>('')
  const diagramTypeId = useId()
  const [stagedFile, setStagedFile] = useState<StagedDiagramFile | null>(null)

  const selectedType = replacing?.type ?? chosenType

  const handleSubmit = async () => {
    if (!stagedFile || !selectedType) return
    if (await onSubmit(stagedFile.file, selectedType)) onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{replacing ? `Replace ${diagramTypeLabel(replacing.type)}` : 'Add Diagram'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!replacing && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor={diagramTypeId}>
                Diagram Type
              </label>
              <Select value={chosenType} onValueChange={(value) => setChosenType(DIAGRAM_TYPES.find((type) => type === value) ?? '')}>
                <SelectTrigger id={diagramTypeId}>
                  <SelectValue placeholder="Select diagram type…" />
                </SelectTrigger>
                <SelectContent>
                  {DIAGRAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {diagramTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {replacing && (
            <div className="space-y-1.5">
              <span className="block text-sm font-medium">Current image</span>
              <div className="rounded-lg border overflow-hidden">
                <DiagramImage src={replacing.url} alt={replacing.name} className="w-full max-h-40 object-contain bg-muted" />
                <p className="text-xs text-muted-foreground px-2 py-1 truncate">{replacing.name}</p>
              </div>
              {replacingHasEvidence && <p className="text-xs text-muted-foreground">The existing evidence keeps the current image. The replacement will not be marked as evidence.</p>}
            </div>
          )}

          <div className="space-y-1.5">
            {replacing && <span className="block text-sm font-medium">New image</span>}
            {!stagedFile ? (
              <FileUpload
                acceptedFileTypes={imageAcceptedFileTypes}
                acceptedFileTypesShort={imageAcceptedFileTypesShort}
                maxFileSizeInMb={MAX_DIAGRAM_SIZE_MB}
                multipleFiles={false}
                inputLabel="Upload diagram image"
                onFileUpload={({ file, url, name }) => {
                  if (file && url) setStagedFile({ file, url, name: name ?? file.name })
                }}
              />
            ) : (
              <div className="relative rounded-lg border overflow-hidden">
                <DiagramImage src={stagedFile.url} alt={stagedFile.name} className="w-full max-h-64 object-contain bg-muted" />
                <Button
                  type="button"
                  variant="icon"
                  size="icon-xs"
                  className="absolute top-2 right-2 rounded-full bg-background/80 hover:bg-background"
                  descriptiveTooltipText="Remove image"
                  onClick={() => setStagedFile(null)}
                >
                  <X />
                </Button>
                <p className="text-xs text-muted-foreground px-2 py-1 truncate">{stagedFile.name}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button size="md" variant="primary" disabled={!stagedFile || !selectedType || isSubmitting} loading={isSubmitting} onClick={handleSubmit}>
              {replacing ? 'Replace Diagram' : 'Add Diagram'}
            </Button>
            <CancelButton disabled={isSubmitting} onClick={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ExpandDiagramDialogProps {
  diagram: PlatformDiagram | null
  onClose: () => void
}

const ExpandDiagramDialog: React.FC<ExpandDiagramDialogProps> = ({ diagram, onClose }) => {
  const { errorNotification } = useNotification()

  return (
    <Dialog open={!!diagram} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{diagram ? diagramTypeLabel(diagram.type) : ''}</DialogTitle>
        </DialogHeader>
        {diagram && (
          <div className="space-y-3">
            <DiagramImage src={diagram.url} alt={diagram.name} className="w-full object-contain max-h-[70vh] rounded-md bg-muted" />
            <div className="flex items-center justify-between gap-2">
              <DiagramUploadedAt createdAt={diagram.createdAt} />
              <Button className="ml-auto" variant="secondary" icon={<Download size={14} />} iconPosition="left" onClick={() => fileDownload(diagram.url, diagram.name, errorNotification)}>
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DiagramActionProps {
  label: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}

const DiagramAction: React.FC<DiagramActionProps> = ({ label, onClick, className, children }) => (
  <Button type="button" variant="icon" size="icon-sm" className={cn('hover:bg-muted', className)} descriptiveTooltipText={label} onClick={onClick}>
    {children}
  </Button>
)

interface DiagramCardProps {
  diagram: PlatformDiagram
  canEdit: boolean
  hasEvidence: boolean
  onExpand: () => void
  onReplace: () => void
  onDelete: () => void
  onMarkEvidence: () => void
  onUnmarkEvidence: () => void
}

const DiagramCard: React.FC<DiagramCardProps> = ({ diagram, canEdit, hasEvidence, onExpand, onReplace, onDelete, onMarkEvidence, onUnmarkEvidence }) => {
  const { errorNotification } = useNotification()

  return (
    <div className="rounded-lg border bg-card overflow-hidden flex flex-col group">
      <button type="button" className="relative flex-1 bg-muted overflow-hidden cursor-pointer min-h-36" onClick={onExpand} aria-label="Expand diagram">
        <DiagramImage src={diagram.url} alt={diagram.name} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
      </button>
      <div className="px-3 py-2 flex flex-col gap-1 border-t">
        <div className="flex flex-wrap items-center justify-between gap-x-2">
          <Badge variant="secondary" className="text-xs">
            {diagramTypeLabel(diagram.type)}
          </Badge>
          <div className="flex items-center gap-1 shrink-0">
            <DiagramAction label="Expand" onClick={onExpand}>
              <Expand size={13} />
            </DiagramAction>
            <DiagramAction label="Download" onClick={() => fileDownload(diagram.url, diagram.name, errorNotification)}>
              <Download size={13} />
            </DiagramAction>
            <DiagramAction
              label={hasEvidence ? 'Remove evidence' : 'Mark as evidence'}
              className={hasEvidence ? 'text-primary hover:text-primary' : undefined}
              onClick={hasEvidence ? onUnmarkEvidence : onMarkEvidence}
            >
              <Fingerprint size={13} />
            </DiagramAction>
            {canEdit && (
              <>
                <DiagramAction label="Replace" onClick={onReplace}>
                  <Replace size={13} />
                </DiagramAction>
                <DiagramAction label="Delete" className="text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 size={13} />
                </DiagramAction>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2">
          <span className="min-w-0 flex-1 text-xs text-muted-foreground truncate">{diagram.name}</span>
          <DiagramUploadedAt createdAt={diagram.createdAt} />
        </div>
      </div>
    </div>
  )
}

interface PlatformDiagramsSectionProps {
  platformId: string
  platformName: string
  canEdit: boolean
  diagrams: PlatformDiagram[]
  isLoading: boolean
}

type DiagramDialogState = { mode: 'add' } | { mode: 'replace'; diagram: PlatformDiagram }

const PlatformDiagramsSection: React.FC<PlatformDiagramsSectionProps> = ({ platformId, platformName, canEdit, diagrams, isLoading }) => {
  const { successNotification, errorNotification } = useNotification()
  const [uploadDialog, setUploadDialog] = useState<DiagramDialogState | null>(null)
  const [expandedDiagram, setExpandedDiagram] = useState<PlatformDiagram | null>(null)
  const [markEvidenceDiagram, setMarkEvidenceDiagram] = useState<PlatformDiagram | null>(null)
  const [unmarkEvidenceDiagram, setUnmarkEvidenceDiagram] = useState<PlatformDiagram | null>(null)

  const { mutateAsync: uploadDiagram, isPending: isUploading } = useUploadPlatformDiagram(platformId)
  const { mutateAsync: removeDiagram } = useRemovePlatformDiagram(platformId)

  const diagramFileIds = useMemo(() => diagrams.map((d) => d.id), [diagrams])
  const { data: evidencesData } = useGetEvidencesWithFileIds(diagramFileIds)

  const fileToEvidenceMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const edge of evidencesData?.evidences?.edges ?? []) {
      const evidenceId = edge?.node?.id
      if (!evidenceId) continue
      for (const fileEdge of edge?.node?.files?.edges ?? []) {
        const fileId = fileEdge?.node?.id
        if (fileId) map.set(fileId, evidenceId)
      }
    }
    return map
  }, [evidencesData])

  const replacingDiagram = uploadDialog?.mode === 'replace' ? uploadDialog.diagram : null

  const closeExpandedDiagram = (diagramId: string) => setExpandedDiagram((current) => (current?.id === diagramId ? null : current))

  const handleUpload = async (file: File, diagramType: DiagramType) => {
    const replacing = replacingDiagram
    try {
      await uploadDiagram({ file, diagramType, replacedFileId: replacing?.id })
      successNotification(
        replacing ? { title: 'Diagram replaced', description: 'The diagram now shows the new image.' } : { title: 'Diagram uploaded', description: 'The diagram was successfully added.' },
      )
      if (replacing) closeExpandedDiagram(replacing.id)
      return true
    } catch (error) {
      errorNotification({ title: replacing ? 'Replace failed' : 'Upload failed', description: parseErrorMessage(error) })
      return false
    }
  }

  const handleDelete = async (diagram: PlatformDiagram) => {
    try {
      await removeDiagram({ fileId: diagram.id, diagramType: diagram.type })
      successNotification({ title: 'Diagram removed', description: 'The diagram was successfully removed.' })
      closeExpandedDiagram(diagram.id)
    } catch (error) {
      errorNotification({ title: 'Delete failed', description: parseErrorMessage(error) })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Architecture &amp; Diagrams</h3>
        {canEdit && (
          <Button type="button" variant="secondary" size="md" icon={<ImagePlus size={14} />} iconPosition="left" onClick={() => setUploadDialog({ mode: 'add' })}>
            Add Diagram
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton width="100%" height="9rem" />
      ) : diagrams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImagePlus size={24} className="opacity-40" />
          <p className="text-sm">{canEdit ? 'No diagrams yet. Click "Add Diagram" to upload one.' : 'No diagrams have been added.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagrams.map((diagram) => (
            <DiagramCard
              key={diagram.id}
              diagram={diagram}
              canEdit={canEdit}
              hasEvidence={fileToEvidenceMap.has(diagram.id)}
              onExpand={() => setExpandedDiagram(diagram)}
              onReplace={() => setUploadDialog({ mode: 'replace', diagram })}
              onDelete={() => handleDelete(diagram)}
              onMarkEvidence={() => setMarkEvidenceDiagram(diagram)}
              onUnmarkEvidence={() => setUnmarkEvidenceDiagram(diagram)}
            />
          ))}
        </div>
      )}

      {uploadDialog && (
        <DiagramUploadDialog
          replacing={replacingDiagram}
          replacingHasEvidence={!!replacingDiagram && fileToEvidenceMap.has(replacingDiagram.id)}
          onSubmit={handleUpload}
          onClose={() => setUploadDialog(null)}
          isSubmitting={isUploading}
        />
      )}
      <ExpandDiagramDialog diagram={expandedDiagram} onClose={() => setExpandedDiagram(null)} />
      {markEvidenceDiagram && (
        <MarkAsDiagramEvidenceDialog
          fileId={markEvidenceDiagram.id}
          fileName={markEvidenceDiagram.name}
          diagramType={markEvidenceDiagram.type}
          platformId={platformId}
          platformName={platformName}
          onClose={() => setMarkEvidenceDiagram(null)}
        />
      )}
      {unmarkEvidenceDiagram && <UnmarkDiagramEvidenceDialog fileId={unmarkEvidenceDiagram.id} fileName={unmarkEvidenceDiagram.name} onClose={() => setUnmarkEvidenceDiagram(null)} />}
    </div>
  )
}

export { PlatformDiagramsSection }
