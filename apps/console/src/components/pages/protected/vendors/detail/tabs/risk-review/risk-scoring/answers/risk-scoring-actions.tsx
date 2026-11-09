'use client'

import React from 'react'
import { ChevronDown, Eye, Pencil } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { downloadRiskQuestionsCsv } from './risk-answers-csv'
import { type TRiskQuestion } from './risk-answers'

const MENU_ANCHOR = elementAnchor('vendor', 'risk-scoring', 'actions')

type TMenuOption = { key: string; title: string; description: string; onSelect?: () => void; disabled?: boolean; comingSoon?: boolean }

type TRiskScoringActionsProps = {
  hasScores: boolean
  canEdit: boolean
  disabledReason?: string
  vendorName: string
  items: readonly TRiskQuestion[]
  onAnswer: () => void
  onUpload: () => void
}

const EDIT_DISABLED_REASON = 'You need edit access to this vendor to answer its risk questions.'

export const RiskScoringActions: React.FC<TRiskScoringActionsProps> = ({ hasScores, canEdit, disabledReason = EDIT_DISABLED_REASON, vendorName, items, onAnswer, onUpload }) => {
  const downloadQuestions = () => downloadRiskQuestionsCsv(items, `${vendorName} risk questions`)

  const options: TMenuOption[] = [
    { key: 'answer', title: 'Answer in Openlane', description: canEdit ? 'Fill in each question yourself' : disabledReason, onSelect: onAnswer, disabled: !canEdit },
    { key: 'download', title: 'Download questions (CSV)', description: 'Send to the vendor to fill in', onSelect: downloadQuestions },
    { key: 'upload', title: 'Upload answered CSV', description: canEdit ? 'Import answers the vendor returned' : disabledReason, onSelect: onUpload, disabled: !canEdit },
    { key: 'questionnaire', title: 'Send questionnaire', description: 'The vendor answers online, kept year over year', disabled: true, comingSoon: true },
    { key: 'soc2', title: 'Import from SOC 2 report', description: 'Answers drafted from the report for you to check', disabled: true, comingSoon: true },
  ]

  return (
    <div className="inline-flex">
      <DisabledReasonTooltip reason={canEdit || hasScores ? undefined : disabledReason}>
        <Button
          type="button"
          variant="secondary"
          className="rounded-r-none"
          icon={canEdit ? <Pencil size={16} /> : <Eye size={16} />}
          iconPosition="left"
          onClick={onAnswer}
          disabled={!canEdit && !hasScores}
        >
          {!canEdit ? 'View answers' : hasScores ? 'Edit answers' : 'Start scoring'}
        </Button>
      </DisabledReasonTooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild {...MENU_ANCHOR}>
          <Button type="button" variant="secondary" className="rounded-l-none border-l-0 px-2" icon={<ChevronDown size={16} />} descriptiveTooltipText="More ways to score" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72" aria-labelledby={MENU_ANCHOR.id}>
          {options.map((option, index) => (
            <React.Fragment key={option.key}>
              {option.comingSoon && !options[index - 1]?.comingSoon && <DropdownMenuSeparator />}
              <DropdownMenuItem disabled={option.disabled} onSelect={option.onSelect} className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col">
                  <span className={cn('text-sm font-medium', option.disabled && 'text-muted-foreground')}>{option.title}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </span>
                {option.comingSoon && (
                  <Badge variant="outline" className="shrink-0">
                    Coming soon
                  </Badge>
                )}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
