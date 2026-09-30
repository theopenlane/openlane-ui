import { CircleCheck, ExternalLink } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import type { TCapture } from '../../lib/capture'
import { evidenceConsoleUrl } from '../../lib/config'
import { formatFooterTimestamp } from '../../lib/footer'
import type { TEvidenceDraft } from '../hooks/use-evidence-draft-form-schema'
import type { TCreatedEvidence } from './review'

type TSuccessProps = {
  evidence: TCreatedEvidence
  capture: TCapture
  draft: TEvidenceDraft
  onCaptureAnother: () => void
}

export const Success = ({ evidence, capture, draft, onCaptureAnother }: TSuccessProps) => (
  <div className="space-y-4 p-4">
    <div className="flex flex-col items-center gap-2 text-center">
      <CircleCheck className="text-success" size={48} />
      <h1 className="text-lg font-semibold">Evidence created</h1>
      <p className="text-sm text-muted-foreground">Your screenshot has been uploaded and added to Openlane.</p>
    </div>
    <Button full icon={<ExternalLink size={14} />} onClick={() => chrome.tabs.create({ url: evidenceConsoleUrl(evidence.id) })}>
      View evidence
    </Button>
    <Button variant="secondary" full onClick={onCaptureAnother}>
      Capture another
    </Button>
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <img src={capture.previewUrl} alt="" className="h-16 w-24 shrink-0 rounded border object-cover object-top" />
      <div className="min-w-0 space-y-1 text-sm">
        <p className="truncate font-semibold">
          {evidence.name} <span className="font-normal text-muted-foreground">{evidence.displayID}</span>
        </p>
        {draft.controls.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {draft.controls.map((control) => (
              <Badge key={control.id} variant="select">
                {control.refCode}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{formatFooterTimestamp(capture.provenance.captured_at)}</p>
        <p className="truncate text-xs text-muted-foreground">{capture.provenance.source_domain}</p>
      </div>
    </div>
  </div>
)
