'use client'

import { useMemo } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { EXCLUDE_TEST_RESPONSES, useAssessmentJsonconfig } from '@/lib/graphql-hooks/assessment'
import { useCanSendQuestionnaire } from '@/lib/authz/use-can-send-questionnaire'
import { DeliveryTab } from '@/components/pages/protected/questionnaire/delivery-tab/delivery-tab'
import { type TAcknowledgementRow } from './acknowledgement-row'

type TAcknowledgementRecipientsProps = {
  acknowledgement: TAcknowledgementRow
  onExport: (row: TAcknowledgementRow) => void
  isExporting: boolean
}

const NO_ENTITY_IDS: string[] = []
const HIDDEN_RECIPIENT_COLUMNS = { dueDate: false, sendAttempts: false }

export const AcknowledgementRecipients = ({ acknowledgement, onExport, isExporting }: TAcknowledgementRecipientsProps) => {
  const { data: jsonconfig } = useAssessmentJsonconfig(acknowledgement.id)
  const campaignIds = useMemo(() => (acknowledgement.campaignId ? [acknowledgement.campaignId] : []), [acknowledgement.campaignId])
  const canResend = useCanSendQuestionnaire(campaignIds, NO_ENTITY_IDS)

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-medium">Recipients ({acknowledgement.sent})</h4>
        <Button
          type="button"
          variant="secondary"
          icon={<Download />}
          iconPosition="left"
          disabled={acknowledgement.completed === 0 || isExporting}
          loading={isExporting}
          onClick={() => onExport(acknowledgement)}
        >
          Export responses
        </Button>
      </div>
      <DeliveryTab assessmentId={acknowledgement.id} jsonconfig={jsonconfig} where={EXCLUDE_TEST_RESPONSES} canSend={canResend} hiddenColumns={HIDDEN_RECIPIENT_COLUMNS} />
    </div>
  )
}
