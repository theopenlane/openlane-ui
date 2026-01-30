import { SiteExistsResponse } from '@/types/site-exists'
import { formatDate } from '@/utils/date'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { ExternalLink, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSnapshot } from '@/lib/query-hooks/snapshot'

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
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [showModal, setShowModal] = useState(false)

  const snapshotData = useSnapshot({ url: normalizedUrl || '' })
  const snapshot = snapshotData.data
  const snapshotLoading = snapshotData?.status === 'pending'

  useEffect(() => {
    if (!normalizedUrl) return

    const checkForSite = async () => {
      try {
        setIsLoading(true)
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
      } finally {
        setIsLoading(false)
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
            <div className="flex-1 pl-2 rounded-md h-6 bg-background text-trust-center-text">{normalizedUrl || 'domain not available'}</div>
          </div>
          <div className="flex-1 gap-2 flex flex-col items-center justify-center h-full">
            {snapshotLoading ? (
              <div className="w-full h-[140px] flex flex-col items-center justify-center bg-muted border rounded-b-md animate-pulse">
                <Shield size={40} className="text-muted-foreground opacity-50" />
                <div className="text-sm text-muted-foreground mt-2">Loading...</div>
              </div>
            ) : snapshot?.data?.image ? (
              <>
                <div className="w-full h-[140px] overflow-hidden rounded-b-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${snapshot.data.image}`}
                    alt="Live site preview"
                    className="w-full h-auto object-top object-cover cursor-zoom-in"
                    onClick={() => setShowModal(true)}
                  />
                </div>
                {showModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowModal(false)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:image/png;base64,${snapshot.data.image}`} alt="Zoomed live site preview" className="rounded-md max-h-[90vh] max-w-[90vw] border-2 border-white shadow-lg" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <Shield size={48} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Snapshot not available</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <p className="text-trust-center-text">Last published</p>
          <p>{formatDate(lastUpdated)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-trust-center-text">Status</p>
          {isLoading ? (
            <div className="flex flex-row items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tasks" />
              <div className="text-tasks">Pending...</div>
            </div>
          ) : isLive ? (
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
