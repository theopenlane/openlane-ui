import { formatDate } from '@/utils/date'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { ExternalLink, Shield } from 'lucide-react'

export interface LivePreviewTrustCenter {
  previewDomain?: {
    cnameRecord: string
  } | null
  previewSetting?: {
    updatedAt: string
  } | null
}

interface LivePreviewProps {
  trustCenter: LivePreviewTrustCenter
}

export const LivePreview = ({ trustCenter }: LivePreviewProps) => {
  const cnameRecord = trustCenter?.previewDomain?.cnameRecord
  const lastUpdated = trustCenter?.previewSetting?.updatedAt
  return (
    <Card className="w-[380px] shrink-0">
      <CardContent className="flex flex-col gap-2">
        <p className="text-xl font-medium leading-7">Live Preview</p>
        <div className="flex flex-col rounded-md h-[185px] border border-border">
          <div className="flex items-center p-3 gap-3 h-[41px] border-b border-border">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-trust-center-red-dot" />
              <div className="w-2.5 h-2.5 rounded-full bg-tasks" />
              <div className="w-2.5 h-2.5 rounded-full bg-trust-center-green-dot" />
            </div>
            <div className="flex-1 pl-2 rounded-md h-6 bg-background text-trust-center-text">{cnameRecord}</div>
          </div>
          <div className="flex-1 gap-2 flex flex-col items-center justify-center h-full">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-trust-center-live-preview-badge-container">{<Shield className="text-primary"></Shield>}</div>
            <div className="h-2 w-[140px] rounded-md bg-trust-center-live-preview-skeleton mt-2"></div>
            <div className="h-2 w-[180px] rounded-md bg-trust-center-live-preview-skeleton mt-1"></div>
          </div>
        </div>
        <div className="flex justify-between">
          <p className="text-trust-center-text">Last published</p>
          <p>{formatDate(lastUpdated)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-trust-center-text">Status</p>
          <p>Status</p>
        </div>
        <a href={normalizeUrl(cnameRecord) ?? undefined} rel="noreferrer" target="_blank" className="w-full">
          <Button disabled={!cnameRecord} variant="secondary" iconPosition="left" icon={<ExternalLink />} className="w-full">
            View live site
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}
