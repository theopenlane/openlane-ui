import { Button } from '@repo/ui/button'
import { BookUp, Eye, RotateCcw } from 'lucide-react'
import UrlInput from '../url-input'

interface BrandingHeaderProps {
  cnameRecord?: string | null
  hasChanges?: boolean | null
  onPreview: () => void
  onRevert: () => void
  onPublish: () => void
}

export const BrandingHeader = ({ cnameRecord, hasChanges, onPreview, onRevert, onPublish }: BrandingHeaderProps) => (
  <div className="flex items-center gap-5 w-full">
    <Button onClick={onPreview} type="button" variant="secondary" icon={<Eye size={16} />}>
      Preview
    </Button>
    {hasChanges && (
      <Button onClick={onRevert} type="button" variant="secondary" icon={<RotateCcw size={16} />}>
        Revert Changes
      </Button>
    )}
    <div className="flex items-center gap-10 flex-1">
      <UrlInput disabled hasCopyButton placeholder={cnameRecord ?? 'Preview URL not available yet'} value={cnameRecord ?? ''} className="h-8" />
      <Button className="ml-auto" variant="primary" icon={<BookUp size={16} />} onClick={onPublish}>
        Publish
      </Button>
    </div>
  </div>
)
