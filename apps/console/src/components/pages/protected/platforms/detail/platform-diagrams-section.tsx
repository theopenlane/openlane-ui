'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Download, Expand, Fingerprint, ImagePlus, Trash2, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useDropzone } from 'react-dropzone'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'
import { toHumanLabel } from '@/utils/strings'
import { useUploadPlatformDiagram, useRemovePlatformDiagram } from '@/lib/graphql-hooks/platform'
import { useGetEvidencesWithFileIds } from '@/lib/graphql-hooks/evidence'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { fileDownload } from '@/components/shared/lib/export'
import MarkAsDiagramEvidenceDialog from './mark-as-diagram-evidence-dialog'
import UnmarkDiagramEvidenceDialog from './unmark-diagram-evidence-dialog'

export type DiagramType = 'architecture' | 'trust-boundary' | 'data-flow'

const diagramTypeLabel = (type: DiagramType) => `${toHumanLabel(type)} Diagram`

export interface PlatformDiagram {
  id: string
  type: DiagramType
  name: string
  url: string
}

interface AddDiagramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (file: File, type: DiagramType) => Promise<void>
  isUploading: boolean
}

const AddDiagramDialog: React.FC<AddDiagramDialogProps> = ({ open, onOpenChange, onAdd, isUploading }) => {
  const { errorNotification } = useNotification()
  const [selectedType, setSelectedType] = useState<DiagramType | ''>('')
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const reset = () => {
    setSelectedType('')
    setStagedFile(null)
    setPreview(null)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return
      if (file.size > 20 * 1024 * 1024) {
        errorNotification({ title: 'File too large', description: 'Maximum file size is 20 MB.' })
        return
      }
      setStagedFile(file)
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    },
    [errorNotification],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': [] },
  })

  const handleAdd = async () => {
    if (!stagedFile || !selectedType) return
    await onAdd(stagedFile, selectedType)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Diagram</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Diagram Type</label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DiagramType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select diagram type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="architecture">Architecture Diagram</SelectItem>
                <SelectItem value="trust-boundary">Trust Boundary Diagram</SelectItem>
                <SelectItem value="data-flow">Data Flow Diagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!stagedFile ? (
            <div
              {...getRootProps()}
              className={cn('rounded-lg border border-dashed border-muted-foreground/40 bg-card h-44 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all', {
                'border-primary bg-muted/50 ring-1 ring-primary/30': isDragActive,
              })}
            >
              <input {...getInputProps()} />
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-center text-muted-foreground">
                Drag &amp; drop an image or <span className="underline">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP (max 20 MB)</p>
            </div>
          ) : (
            <div className="relative rounded-lg border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview && <img src={preview} alt={stagedFile.name} className="w-full max-h-64 object-contain bg-muted" />}
              <button
                type="button"
                onClick={() => {
                  setStagedFile(null)
                  setPreview(null)
                }}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background transition-colors"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
              <p className="text-xs text-muted-foreground px-2 py-1 truncate">{stagedFile.name}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button size="md" variant="primary" disabled={!stagedFile || !selectedType || isUploading} loading={isUploading} onClick={handleAdd}>
              Add Diagram
            </Button>
            <Button variant="secondary" disabled={isUploading} onClick={handleClose}>
              Cancel
            </Button>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={diagram.url} alt={diagram.name} className="w-full object-contain max-h-[70vh] rounded-md bg-muted" />
            <div className="flex justify-end">
              <Button variant="secondary" icon={<Download size={14} />} iconPosition="left" onClick={() => fileDownload(diagram.url, diagram.name, errorNotification)}>
                Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DiagramCardProps {
  diagram: PlatformDiagram
  canEdit: boolean
  hasEvidence: boolean
  onExpand: () => void
  onDelete: () => void
  onMarkEvidence: () => void
  onUnmarkEvidence: () => void
}

const DiagramCard: React.FC<DiagramCardProps> = ({ diagram, canEdit, hasEvidence, onExpand, onDelete, onMarkEvidence, onUnmarkEvidence }) => {
  const { errorNotification } = useNotification()

  return (
    <div className="rounded-lg border bg-card overflow-hidden flex flex-col group">
      <button type="button" className="relative flex-1 bg-muted overflow-hidden cursor-pointer min-h-36" onClick={onExpand} aria-label="Expand diagram">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={diagram.url} alt={diagram.name} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
      </button>
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-t">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="text-xs shrink-0">
            {diagramTypeLabel(diagram.type)}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">{diagram.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={onExpand}
            aria-label="Expand"
          >
            <Expand size={13} />
          </button>
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => fileDownload(diagram.url, diagram.name, errorNotification)}
            aria-label="Download"
          >
            <Download size={13} />
          </button>
          <TooltipProvider disableHoverableContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn('h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors', hasEvidence ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
                  onClick={hasEvidence ? onUnmarkEvidence : onMarkEvidence}
                  aria-label={hasEvidence ? 'Remove evidence' : 'Mark as evidence'}
                >
                  <Fingerprint size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{hasEvidence ? 'Remove evidence' : 'Mark as evidence'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {canEdit && (
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-destructive hover:text-destructive transition-colors"
              onClick={onDelete}
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
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
}

const PlatformDiagramsSection: React.FC<PlatformDiagramsSectionProps> = ({ platformId, platformName, canEdit, diagrams }) => {
  const { successNotification, errorNotification } = useNotification()
  const [addOpen, setAddOpen] = useState(false)
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

  const handleAdd = async (file: File, diagramType: DiagramType) => {
    try {
      await uploadDiagram({ file, diagramType })
      successNotification({ title: 'Diagram uploaded', description: 'The diagram was successfully added.' })
    } catch (error) {
      errorNotification({ title: 'Upload failed', description: parseErrorMessage(error) })
      throw error
    }
  }

  const handleDelete = async (diagram: PlatformDiagram) => {
    try {
      await removeDiagram({ fileId: diagram.id, diagramType: diagram.type })
      successNotification({ title: 'Diagram removed', description: 'The diagram was successfully removed.' })
      if (expandedDiagram?.id === diagram.id) setExpandedDiagram(null)
    } catch (error) {
      errorNotification({ title: 'Delete failed', description: parseErrorMessage(error) })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Architecture &amp; Diagrams</h3>
        {canEdit && (
          <Button type="button" variant="secondary" size="md" icon={<ImagePlus size={14} />} iconPosition="left" onClick={() => setAddOpen(true)}>
            Add Diagram
          </Button>
        )}
      </div>

      {diagrams.length === 0 ? (
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
              onDelete={() => handleDelete(diagram)}
              onMarkEvidence={() => setMarkEvidenceDiagram(diagram)}
              onUnmarkEvidence={() => setUnmarkEvidenceDiagram(diagram)}
            />
          ))}
        </div>
      )}

      <AddDiagramDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} isUploading={isUploading} />
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
