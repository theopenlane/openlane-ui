import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { BookUp, Eye, RotateCcw } from 'lucide-react'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import UrlDisplay from '../../shared/url-display'
import { CreateTrustCenterUrlsAction } from '../../shared/trust-center-urls-setup'
import { useCreateTrustCenterUrls } from '../../shared/use-create-trust-center-urls'

interface BrandingHeaderProps {
  ref?: React.Ref<HTMLDivElement>
  previewUrl: string
  hasUnsavedChanges: boolean
  hasPreviewChanges: boolean
  isPreviewAvailable: boolean
  isFirstPublish: boolean
  needsUrlSetup: boolean
  onPreview: () => void
  onRevert: () => void
  onPublish: () => void
}

const NOTHING_TO_SAVE = 'No unsaved changes. Edit a field to save it to your preview site.'
const NOTHING_TO_PUBLISH = 'Your live site already matches the preview.'
const PREVIEW_UNAVAILABLE = 'Preview settings are not available for this Trust Center yet.'
const CREATE_URLS_FIRST = 'Create your Trust Center URLs before publishing.'

const SCROLL_GUTTER_COVER = "before:content-[''] before:absolute before:inset-x-0 before:bottom-full before:h-4 before:bg-secondary before:pointer-events-none"

export const BrandingHeader = ({ ref, previewUrl, hasUnsavedChanges, hasPreviewChanges, isPreviewAvailable, isFirstPublish, needsUrlSetup, onPreview, onRevert, onPublish }: BrandingHeaderProps) => {
  const urls = useCreateTrustCenterUrls()
  const savePreviewBlockedReason = !isPreviewAvailable ? PREVIEW_UNAVAILABLE : hasUnsavedChanges ? null : NOTHING_TO_SAVE
  const publishBlockedReason = !isPreviewAvailable ? PREVIEW_UNAVAILABLE : needsUrlSetup ? CREATE_URLS_FIRST : hasUnsavedChanges || hasPreviewChanges || isFirstPublish ? null : NOTHING_TO_PUBLISH

  return (
    <div ref={ref} className={cn('sticky top-0 z-(--z-page-sticky-bar) flex items-center gap-4 w-full bg-secondary py-3', SCROLL_GUTTER_COVER)}>
      {previewUrl ? (
        <UrlDisplay label="Preview URL:" url={previewUrl} className="flex-1 min-w-0" />
      ) : (
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <p className="min-w-0 text-sm text-muted-foreground">No preview URL yet. Create your Trust Center URLs to preview your changes.</p>
          <CreateTrustCenterUrlsAction urls={urls} />
        </div>
      )}
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
