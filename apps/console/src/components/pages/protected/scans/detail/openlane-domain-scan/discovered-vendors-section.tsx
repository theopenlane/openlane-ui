'use client'

import React, { useState } from 'react'
import { Building2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { buildVendorLogoProxyUrl, toVendorLogoHost } from '@/lib/vendor-logo'
import { getVendors, type ScanMetadata } from './scan-metadata'

type Props = {
  metadata: ScanMetadata | null
}

const getFaviconUrl = (url?: string): string | null => {
  if (!url || url === 'Unknown') {
    return null
  }
  const host = toVendorLogoHost(url)
  return host ? buildVendorLogoProxyUrl(host, 64) : null
}

const DiscoveredVendorsSection: React.FC<Props> = ({ metadata }) => {
  const vendors = getVendors(metadata)
  const [isExpanded, setIsExpanded] = useState(true)

  if (!vendors.length) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <button type="button" onClick={() => setIsExpanded((prev) => !prev)} className="flex items-center justify-between gap-2 text-left w-full mb-2">
          <div>
            <p className="text-lg font-medium leading-7">Discovered Vendors</p>
            <p className="text-sm text-muted-foreground">Third parties identified from this scan</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CountBadge count={vendors.length} />
            <ChevronRight size={16} className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </button>
        {isExpanded && (
          <div className="grid grid-cols-2 gap-3">
            {vendors.map((vendor, index) => {
              const faviconUrl = getFaviconUrl(vendor.url)
              const content = (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-md border shrink-0 overflow-hidden bg-white">
                    {faviconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={faviconUrl} alt="" className="w-5 h-5" />
                    ) : (
                      <Building2 size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{vendor.name}</p>
                    {vendor.categories && vendor.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {vendor.categories.map((category) => (
                          <Badge key={category} variant="outline" className="text-[10px]">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )

              return vendor.url && vendor.url !== 'Unknown' ? (
                <a key={`${vendor.name}-${index}`} href={vendor.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-secondary transition-colors">
                  {content}
                </a>
              ) : (
                <div key={`${vendor.name}-${index}`} className="flex items-center gap-3 rounded-lg border p-3">
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DiscoveredVendorsSection
