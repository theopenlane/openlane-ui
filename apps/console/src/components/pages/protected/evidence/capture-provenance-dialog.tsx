'use client'

import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { CircleCheck, CircleX, ShieldCheck } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { toSha256Hex, type TCaptureProvenance } from '@repo/evidence-capture/provenance'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { formatDateTimeWithZone } from '@/utils/date'
import { formatFileSize } from '@/utils/strings'
import { cn } from '@repo/ui/lib/utils'
import type { GetEvidenceFilesPaginatedQuery } from '@repo/codegen/src/schema'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'

type TEvidenceFileNode = NonNullable<NonNullable<NonNullable<NonNullable<GetEvidenceFilesPaginatedQuery['evidence']['files']['edges']>[number]>['node']>>

type TStoredFile = Pick<TEvidenceFileNode, 'presignedURL' | 'md5Hash' | 'createdAt'>

type TCaptureProvenanceDialogProps = {
  provenance: TCaptureProvenance
  file: TStoredFile
  onClose: () => void
}

const CLOCK_LABEL: Record<TCaptureProvenance['captured_at_source'], string> = {
  server: 'Openlane server time, read by the extension at capture',
  client: 'Browser clock (Openlane server time was unavailable)',
}

const fetchSha256 = async (url: string) => {
  const response = await fetch(url).catch((cause: Error) => {
    throw new UserFacingError('The stored file could not be downloaded. Please try again later.', { cause })
  })
  if (!response.ok) {
    throw new UserFacingError(`The stored file could not be downloaded (HTTP ${response.status}). Reopen this dialog to get a fresh download link.`)
  }
  return toSha256Hex(await response.arrayBuffer())
}

const IntegrityResult = ({ matches }: { matches: boolean }) => (
  <span className={cn('flex items-center gap-1.5 text-sm', matches ? 'text-success' : 'text-destructive')}>
    {matches ? <CircleCheck size={16} /> : <CircleX size={16} />}
    {matches ? 'The stored file matches the hash recorded at capture.' : 'The stored file does not match the hash recorded at capture.'}
  </span>
)

const ProvenanceRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 py-2">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
)

export const CaptureProvenanceDialog = ({ provenance, file, onClose }: TCaptureProvenanceDialogProps) => {
  const integrity = useMutation({ mutationFn: fetchSha256 })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Capture provenance</DialogTitle>
          <DialogDescription>Reported by the capture extension and stored with the file when it was uploaded. Only the last row is computed by Openlane itself.</DialogDescription>
        </DialogHeader>

        <dl className="divide-y text-sm">
          <ProvenanceRow label="Captured at">
            {formatDateTimeWithZone(provenance.captured_at)}
            <span className="block text-xs text-muted-foreground">{CLOCK_LABEL[provenance.captured_at_source]}</span>
          </ProvenanceRow>
          <ProvenanceRow label="Source page">
            <ExternalLinkValue value={provenance.source_url} />
            <span className="block text-xs text-muted-foreground">{provenance.page_title}</span>
          </ProvenanceRow>
          <ProvenanceRow label="Captured by">{provenance.collector_email}</ProvenanceRow>
          <ProvenanceRow label="Capture source">{provenance.capture_source}</ProvenanceRow>
          <ProvenanceRow label="Capture size">
            {provenance.viewport.width} × {provenance.viewport.height} px
          </ProvenanceRow>
          <ProvenanceRow label="Browser">
            <span className="text-xs text-muted-foreground">{provenance.user_agent}</span>
          </ProvenanceRow>
          <ProvenanceRow label="File">
            {provenance.artifact_mime_type}, {formatFileSize(provenance.artifact_size_bytes)}
          </ProvenanceRow>
          <ProvenanceRow label="SHA-256">
            <span className="font-mono text-xs break-all">{provenance.artifact_sha256}</span>
          </ProvenanceRow>
          <ProvenanceRow label="Received by Openlane">
            {formatDateTimeWithZone(file.createdAt)}
            <span className="block text-xs text-muted-foreground">
              MD5 computed by the server: <span className="font-mono break-all">{file.md5Hash ?? '-'}</span>
            </span>
          </ProvenanceRow>
        </dl>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon={<ShieldCheck size={16} />}
            iconPosition="left"
            loading={integrity.isPending}
            disabled={!file.presignedURL || integrity.isPending || integrity.isSuccess}
            onClick={() => file.presignedURL && integrity.mutate(file.presignedURL)}
          >
            Verify file integrity
          </Button>
          {integrity.isSuccess && <IntegrityResult matches={integrity.data === provenance.artifact_sha256} />}
          {integrity.isError && <span className="text-sm text-destructive">{parseErrorMessage(integrity.error)}</span>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
