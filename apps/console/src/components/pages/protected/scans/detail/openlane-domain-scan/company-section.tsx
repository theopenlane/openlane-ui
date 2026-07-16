'use client'

import React from 'react'
import { CircleCheck, CircleX, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import Github from '@/assets/Github'
import Linkedin from '@/assets/Linkedin'
import Discord from '@/assets/Discord'
import Twitter from '@/assets/Twitter'
import Instagram from '@/assets/Instagram'
import Youtube from '@/assets/Youtube'
import { getCompanyInfo, type ScanMetadata } from './scan-metadata'

type Props = {
  metadata: ScanMetadata | null
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  github: <Github size={16} />,
  linkedin: <Linkedin size={16} />,
  discord: <Discord size={16} />,
  twitter: <Twitter size={16} />,
  x: <Twitter size={16} />,
  instagram: <Instagram size={16} />,
  youtube: <Youtube size={16} />,
}

const CompanySection: React.FC<Props> = ({ metadata }) => {
  const company = getCompanyInfo(metadata)

  if (!company) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-medium leading-7">{company.name || 'Company'}</p>
            <p className="text-sm text-muted-foreground">{company.industry ?? 'Company information discovered from this scan'}</p>
          </div>

          {company.socialLinks.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              {company.socialLinks.map((link) => (
                <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" title={link.platform} className="text-muted-foreground hover:text-foreground transition-colors">
                  {SOCIAL_ICONS[link.platform] ?? <LinkIcon size={16} />}
                </a>
              ))}
            </div>
          )}
        </div>

        {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}

        {company.isSoc2 !== undefined && (
          <div className="flex items-center gap-1.5 text-sm">
            {company.isSoc2 ? (
              <>
                <CircleCheck size={14} className="text-success" /> SOC 2 Compliant
              </>
            ) : (
              <>
                <CircleX size={14} className="text-destructive" /> Not SOC 2 Compliant
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompanySection
