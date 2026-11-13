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

export const UPLOAD_ANSWERS_LABEL = 'Upload completed questionnaire'

const EDIT_DISABLED_REASON = 'You need edit access to this vendor to answer its risk questions.'

export const RiskScoringActions: React.FC<TRiskScoringActionsProps> = ({ hasScores, canEdit, disabledReason = EDIT_DISABLED_REASON, vendorName, items, onAnswer, onUpload }) => {
  const downloadQuestions = () => downloadRiskQuestionsCsv(items, `${vendorName} risk questions`)

  const options: TMenuOption[] = [
    { key: 'answer', title: 'Answer questions', description: canEdit ? 'Complete the assessment yourself' : disabledReason, onSelect: onAnswer, disabled: !canEdit },
    { key: 'download', title: 'Download questions (CSV)', description: 'Share with the vendor to complete', onSelect: downloadQuestions },
    { key: 'upload', title: UPLOAD_ANSWERS_LABEL, description: canEdit ? 'Import answers from a CSV file' : disabledReason, onSelect: onUpload, disabled: !canEdit },
    { key: 'questionnaire', title: 'Send questionnaire to vendor', description: 'Let vendors answer directly in Openlane', disabled: true, comingSoon: true },
    { key: 'soc2', title: 'Import from SOC 2 report', description: 'Generate draft answers from a SOC 2 report', disabled: true, comingSoon: true },
  ]

  const variant = canEdit && !hasScores ? 'primary' : 'secondary'

  return (
    <div className="inline-flex">
      <DisabledReasonTooltip reason={canEdit || hasScores ? undefined : disabledReason}>
        <Button
          type="button"
          variant={variant}
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
          <Button type="button" variant={variant} className="rounded-l-none border-l-0 px-2" icon={<ChevronDown size={16} />} descriptiveTooltipText="More ways to score" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72" aria-labelledby={MENU_ANCHOR.id}>
          {options.map((option, index) => (
            <React.Fragment key={option.key}>
              {option.comingSoon && !options[index - 1]?.comingSoon && <DropdownMenuSeparator />}
              <DropdownMenuItem disabled={option.disabled} onSelect={option.onSelect} className="flex flex-col items-stretch gap-0.5">
                <span className="flex items-center justify-between gap-3">
                  <span className={cn('text-sm font-medium', option.disabled && 'text-muted-foreground')}>{option.title}</span>
                  {option.comingSoon && (
                    <Badge variant="outline" className="shrink-0">
                      Coming soon
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
