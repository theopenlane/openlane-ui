import { Button } from '@repo/ui/button'
import { BookUp, Eye, RotateCcw } from 'lucide-react'
import UrlDisplay from '../../shared/url-display'
import { buildPreviewUrl } from '../helpers/preview-url'

interface BrandingHeaderProps {
  cnameRecord?: string | null
  hasChanges?: boolean | null
  onPreview: () => void
  onRevert: () => void
  onPublish: () => void
}

export const BrandingHeader = ({ cnameRecord, hasChanges, onPreview, onRevert, onPublish }: BrandingHeaderProps) => {
  const url = buildPreviewUrl(cnameRecord)
  return (
    <div className="sticky top-0 z-20 flex items-center gap-4 w-full bg-secondary py-3">
      <UrlDisplay label="Preview URL:" url={url} emptyText={cnameRecord ?? 'Preview URL not available yet'} className="flex-1 min-w-0" />
      {hasChanges && (
        <Button onClick={onRevert} type="button" variant="secondary" icon={<RotateCcw size={16} />}>
          Revert Changes
        </Button>
      )}
      <Button onClick={onPreview} type="button" variant="secondary" icon={<Eye size={16} />}>
        Save Preview
      </Button>
      <Button type="button" variant="primary" icon={<BookUp size={16} />} onClick={onPublish}>
        Publish
      </Button>
    </div>
  )
}
