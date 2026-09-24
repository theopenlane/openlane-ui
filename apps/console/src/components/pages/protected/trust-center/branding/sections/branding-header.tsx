import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { BookUp, Eye, RotateCcw } from 'lucide-react'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import UrlDisplay from '../../shared/url-display'

interface BrandingHeaderProps {
  ref?: React.Ref<HTMLDivElement>
  previewUrl: string
  hasUnsavedChanges: boolean
  hasPreviewChanges: boolean
  isPreviewAvailable: boolean
  onPreview: () => void
  onRevert: () => void
  onPublish: () => void
}

const NOTHING_TO_SAVE = 'No unsaved changes. Edit a field to save it to your preview site.'
const NOTHING_TO_PUBLISH = 'Your live site already matches the preview.'
const PREVIEW_UNAVAILABLE = 'Preview settings are not available for this Trust Center yet.'

const SCROLL_GUTTER_COVER = "before:content-[''] before:absolute before:inset-x-0 before:bottom-full before:h-4 before:bg-secondary before:pointer-events-none"

export const BrandingHeader = ({ ref, previewUrl, hasUnsavedChanges, hasPreviewChanges, isPreviewAvailable, onPreview, onRevert, onPublish }: BrandingHeaderProps) => {
  const savePreviewBlockedReason = !isPreviewAvailable ? PREVIEW_UNAVAILABLE : hasUnsavedChanges ? null : NOTHING_TO_SAVE
  const publishBlockedReason = !isPreviewAvailable ? PREVIEW_UNAVAILABLE : hasUnsavedChanges || hasPreviewChanges ? null : NOTHING_TO_PUBLISH

  return (
    <div ref={ref} className={cn('sticky top-0 z-(--z-page-sticky-bar) flex items-center gap-4 w-full bg-secondary py-3', SCROLL_GUTTER_COVER)}>
      <UrlDisplay label="Preview URL:" url={previewUrl} emptyText="Preview URL not available yet" className="flex-1 min-w-0" />
      {hasPreviewChanges && (
        <Button onClick={onRevert} type="button" variant="secondary" icon={<RotateCcw size={16} />}>
          Revert Changes
        </Button>
      )}
      <DisabledReasonTooltip reason={savePreviewBlockedReason}>
        <Button onClick={onPreview} type="button" variant="secondary" icon={<Eye size={16} />} disabled={!!savePreviewBlockedReason}>
          Save Preview
        </Button>
      </DisabledReasonTooltip>
      <DisabledReasonTooltip reason={publishBlockedReason}>
        <Button type="button" variant="primary" icon={<BookUp size={16} />} onClick={onPublish} disabled={!!publishBlockedReason}>
          Publish
        </Button>
      </DisabledReasonTooltip>
    </div>
  )
}
