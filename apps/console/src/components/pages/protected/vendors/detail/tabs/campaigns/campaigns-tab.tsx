'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import type { GetEntityAssociationsQuery } from '@repo/codegen/src/schema'

interface CampaignsTabProps {
  associations?: GetEntityAssociationsQuery
}

const CampaignsTab: React.FC<CampaignsTabProps> = ({ associations }) => {
  const campaigns = associations?.entity?.campaigns?.edges?.map((e) => e?.node).filter(Boolean) ?? []

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No campaigns associated with this vendor.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <Card key={campaign?.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{campaign?.name}</CardTitle>
              {campaign?.displayID && <Badge variant="outline">{campaign.displayID}</Badge>}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export default CampaignsTab
