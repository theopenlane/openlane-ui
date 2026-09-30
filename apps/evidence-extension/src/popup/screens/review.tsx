import { useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { Button } from '@repo/ui/button'
import type { TCapture } from '../../lib/capture'
import type { TConnection } from '../../lib/connection'
import { uploadCapturedEvidence } from '../../lib/upload'
import { ScreenTitle } from '../components/popup-header'
import { ErrorAlert, errorMessage } from '../components/error-alert'
import type { TEvidenceDraft } from '../hooks/use-evidence-draft-form-schema'
import { EVIDENCE_FLOW_MUTATION_KEY } from '../hooks/use-openlane-queries'

export type TCreatedEvidence = Awaited<ReturnType<typeof uploadCapturedEvidence>>

type TReviewProps = {
  connection: TConnection
  capture: TCapture
  draft: TEvidenceDraft
  onRetake: () => void
  onUploaded: (evidence: TCreatedEvidence) => void
}

export const Review = ({ connection, capture, draft, onRetake, onUploaded }: TReviewProps) => {
  const upload = useMutation({
    mutationKey: EVIDENCE_FLOW_MUTATION_KEY,
    mutationFn: () =>
      uploadCapturedEvidence(connection, capture, {
        name: draft.name,
        description: draft.description,
        controlIDs: draft.controls.map((control) => control.id),
      }),
  })

  return (
    <div className="space-y-4 p-4">
      <ScreenTitle title="Review screenshot" description="Confirm, then upload as evidence." />
      <img src={capture.previewUrl} alt={`Screenshot of ${capture.provenance.source_domain}`} className="max-h-80 w-full rounded-md border object-contain object-top" />
      <p className="text-xs break-all text-muted-foreground">SHA-256 {capture.provenance.artifact_sha256}</p>
      {upload.isError && <ErrorAlert>{errorMessage(upload.error, 'The evidence could not be uploaded.')}</ErrorAlert>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" full onClick={onRetake} disabled={upload.isPending}>
          Retake
        </Button>
        <Button full icon={<Upload size={16} />} iconPosition="left" loading={upload.isPending} disabled={upload.isPending} onClick={() => upload.mutate(undefined, { onSuccess: onUploaded })}>
          Upload as evidence
        </Button>
      </div>
    </div>
  )
}
