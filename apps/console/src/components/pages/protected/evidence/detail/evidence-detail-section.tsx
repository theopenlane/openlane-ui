'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'

type TEvidenceDetailSectionProps = {
  title: string
  children: React.ReactNode
}

const EvidenceDetailSection: React.FC<TEvidenceDetailSectionProps> = ({ title, children }) => (
  <Card>
    <CardContent className="flex flex-col gap-4 p-5">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </CardContent>
  </Card>
)

export default EvidenceDetailSection
