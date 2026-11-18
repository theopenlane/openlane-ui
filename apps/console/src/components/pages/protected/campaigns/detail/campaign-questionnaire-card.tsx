'use client'

import React from 'react'
import NextLink from 'next/link'
import { Calendar, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { formatDate } from '@/utils/date'
import { questionnaireHref } from '../questionnaire-source'
import { type TCampaignQuestionnaire } from './campaign-questionnaire'

interface CampaignQuestionnaireCardProps {
  questionnaire: TCampaignQuestionnaire
  responsesHref: string | null
  launched: boolean
}

const NewTabButtonLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Button variant="secondary" asChild className="w-full justify-center" icon={<ExternalLink />}>
    <NextLink href={href} target="_blank" rel="noopener noreferrer" prefetch={false}>
      {children}
    </NextLink>
  </Button>
)

export const CampaignQuestionnaireCard: React.FC<CampaignQuestionnaireCardProps> = ({ questionnaire, responsesHref, launched }) => {
  const responsesLink = responsesHref && (launched || questionnaire.ref.source === 'template') ? responsesHref : undefined

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{questionnaire.heading}</h3>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium break-words">{questionnaire.name}</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-sm bg-secondary">
            <Calendar size={14} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p className="text-sm">{formatDate(questionnaire.updatedAt, '—')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-sm bg-secondary">
            <FileText size={14} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{questionnaire.detailLabel}</p>
            <p className="text-sm">{questionnaire.detail}</p>
          </div>
        </div>
        {responsesLink ? (
          <NewTabButtonLink href={responsesLink}>View responses</NewTabButtonLink>
        ) : (
          questionnaire.ref.source === 'assessment' && <NewTabButtonLink href={questionnaireHref(questionnaire.ref)}>Open questionnaire</NewTabButtonLink>
        )}
      </div>
    </div>
  )
}
