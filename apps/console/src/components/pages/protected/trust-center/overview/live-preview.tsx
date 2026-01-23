import { SiteExistsResponse } from '@/types/site-exists'
import { formatDate } from '@/utils/date'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { ExternalLink, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface LivePreviewTrustCenter {
  customDomain?: {
    cnameRecord: string
  } | null
  updatedAt: string
}

interface LivePreviewProps {
  trustCenter: LivePreviewTrustCenter
}

export const LivePreview = ({ trustCenter }: LivePreviewProps) => {
  const cnameRecord = trustCenter?.customDomain?.cnameRecord
  const lastUpdated = trustCenter?.updatedAt
  const normalizedUrl = normalizeUrl(cnameRecord)
  const [isLive, setIsLive] = useState<boolean>(false)

  useEffect(() => {
    if (!normalizedUrl) return

    const checkForSite = async () => {
      try {
        const res = await fetch('/api/site-exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizedUrl }),
        })

        const siteData: SiteExistsResponse = await res.json()

        if (!res.ok) {
          setIsLive(false)
          return
        }
        setIsLive(siteData.exists)
      } catch {
        setIsLive(false)
      }
    }
    checkForSite()
  }, [normalizedUrl])

  return (
    <Card className="w-[550px] shrink-0">
      <CardContent className="flex flex-col gap-2">
        <p className="text-xl font-medium leading-7">Live Preview</p>
        <div className="flex flex-col rounded-md h-[185px] border border-border">
          <div className="flex items-center p-3 gap-3 h-[41px] border-b border-border">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-trust-center-red-dot" />
              <div className="w-2.5 h-2.5 rounded-full bg-tasks" />
              <div className="w-2.5 h-2.5 rounded-full bg-trust-center-green-dot" />
            </div>
            <div className="flex-1 pl-2 rounded-md h-6 bg-background text-trust-center-text">{cnameRecord || 'meow.comply.theopenlane.net'}</div>
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
          {isLive ? (
            <div className="flex flex-row items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-trust-center-green-dot" />
              <div className="text-trust-center-green-dot">Live</div>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-trust-center-red-dot" />
              <div className="text-trust-center-red-dot">Not live</div>
            </div>
          )}
        </div>
        <a href={normalizeUrl(cnameRecord) ?? undefined} rel="noreferrer" target="_blank" className="w-full">
          <Button disabled={!cnameRecord || !isLive} variant="secondary" iconPosition="left" icon={<ExternalLink />} className="w-full">
            View live site
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}
