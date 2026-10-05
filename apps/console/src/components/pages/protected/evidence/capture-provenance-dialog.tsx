'use client'

import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { CircleCheck, CircleX, ShieldCheck } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { toSha256Hex, type TCaptureProvenance, type TFileProvenance } from '@repo/evidence-capture/provenance'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { formatDateTimeWithZone } from '@/utils/date'
import { formatFileSize } from '@/utils/strings'
import { cn } from '@repo/ui/lib/utils'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'

type TCaptureProvenanceDialogProps = {
  provenance: TFileProvenance
  presignedURL?: string | null
  md5Hash?: string | null
  onClose: () => void
}

const CLOCK_LABEL: Record<TCaptureProvenance['captured_at_source'], string> = {
  server: 'Openlane server time, read by the extension at capture',
  client: 'Browser clock (Openlane server time was unavailable)',
}

const AUTHENTICATION_LABEL: Record<string, string> = {
  api_token: 'API token',
  pat: 'Personal access token',
  jwt: 'Signed-in session',
}

const authenticationLabel = (type: string) => AUTHENTICATION_LABEL[type] ?? type

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
    {matches ? 'The stored file still matches the hash Openlane computed at upload.' : 'The stored file no longer matches the hash Openlane computed at upload.'}
  </span>
)

const ProvenanceRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 py-2">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
)

const ProvenanceSection = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <section className="space-y-1">
    <h3 className="text-sm font-medium">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
    <dl className="divide-y text-sm">{children}</dl>
  </section>
)

export const CaptureProvenanceDialog = ({ provenance, presignedURL, md5Hash, onClose }: TCaptureProvenanceDialogProps) => {
  const integrity = useMutation({ mutationFn: fetchSha256 })
  const { claims, uploadedBy } = provenance
  const authorMaps = useAuthorMaps([uploadedBy.subjectId, uploadedBy.impersonatorId, uploadedBy.systemAdminId])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Capture provenance</DialogTitle>
          <DialogDescription>Stored once when the file was uploaded and never changed afterwards.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          <ProvenanceSection title="Verified by Openlane" description="Recorded by the Openlane server when it received the file.">
            <ProvenanceRow label="Received at">{formatDateTimeWithZone(provenance.receivedAt)}</ProvenanceRow>
            <ProvenanceRow label="Uploaded by">
              <AuthorCell id={uploadedBy.subjectId} {...authorMaps} />
              <span className="block text-xs text-muted-foreground">{authenticationLabel(uploadedBy.authenticationType)}</span>
              {uploadedBy.impersonatorId && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  Acting on their behalf: <AuthorCell id={uploadedBy.impersonatorId} {...authorMaps} showAvatar={false} className="text-xs" />
                </span>
              )}
              {uploadedBy.systemAdminId && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  System admin: <AuthorCell id={uploadedBy.systemAdminId} {...authorMaps} showAvatar={false} className="text-xs" />
                </span>
              )}
            </ProvenanceRow>
            <ProvenanceRow label="SHA-256">
              <span className="font-mono text-xs break-all">{provenance.serverSha256}</span>
              <span className="mt-1 block">
                {provenance.hashVerified ? <Badge variant="green">Matches the hash reported at capture</Badge> : <Badge variant="outline">No hash was reported at capture</Badge>}
              </span>
              {md5Hash && (
                <span className="block text-xs text-muted-foreground">
                  MD5: <span className="font-mono break-all">{md5Hash}</span>
                </span>
              )}
            </ProvenanceRow>
          </ProvenanceSection>

          <ProvenanceSection title="Reported by the extension" description="Captured by the browser extension and sent with the file; Openlane stores it as reported.">
            <ProvenanceRow label="Captured at">
              {formatDateTimeWithZone(claims.captured_at)}
              <span className="block text-xs text-muted-foreground">{CLOCK_LABEL[claims.captured_at_source]}</span>
            </ProvenanceRow>
            <ProvenanceRow label="Source page">
              <ExternalLinkValue value={claims.source_url} />
              <span className="block text-xs text-muted-foreground">{claims.page_title}</span>
            </ProvenanceRow>
            <ProvenanceRow label="Captured by">{claims.collector_email}</ProvenanceRow>
            <ProvenanceRow label="Capture source">{claims.capture_source}</ProvenanceRow>
            <ProvenanceRow label="Capture size">
              {claims.viewport.width} × {claims.viewport.height} px
            </ProvenanceRow>
            <ProvenanceRow label="Browser">
              <span className="text-xs text-muted-foreground">{claims.user_agent}</span>
            </ProvenanceRow>
            <ProvenanceRow label="File">
              {claims.artifact_mime_type}, {formatFileSize(claims.artifact_size_bytes)}
            </ProvenanceRow>
          </ProvenanceSection>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon={<ShieldCheck size={16} />}
            iconPosition="left"
            loading={integrity.isPending}
            disabled={!presignedURL || integrity.isPending || integrity.isSuccess}
            onClick={() => presignedURL && integrity.mutate(presignedURL)}
          >
            Verify file integrity
          </Button>
          {integrity.isSuccess && <IntegrityResult matches={integrity.data === provenance.serverSha256} />}
          {integrity.isError && <span className="text-sm text-destructive">{parseErrorMessage(integrity.error)}</span>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
