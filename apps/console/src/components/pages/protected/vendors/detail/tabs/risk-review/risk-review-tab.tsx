'use client'

import React, { useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { AlertTriangle, Clock, ClipboardCheck, CalendarClock } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@repo/ui/dropdown-menu'
import { EntityFrequency, type EntityQuery, type UpdateEntityInput } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { reviewHistoryColumns, isHighRiskTier } from './risk-review-config'
import CreateReviewSheet from './create-review-sheet'
import ReviewDetailSheet from './review-detail-sheet'

interface RiskReviewTabProps {
  vendor: EntityQuery['entity']
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
  canEdit: boolean
  isEditing: boolean
}

const RiskReviewTab: React.FC<RiskReviewTabProps> = ({ vendor, handleUpdateField, canEdit, isEditing }) => {
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)

  const { reviewsNodes, isLoading } = useReviewsWithFilter({
    where: { hasEntitiesWith: [{ id: vendor.id }] },
  })

  const isOverdue = vendor.nextReviewAt && new Date(vendor.nextReviewAt) < new Date()
  const isHighRisk = isHighRiskTier(vendor.tier)

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEdit,
    isCreate: false,
    data: vendor,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  const riskScoreFieldProps = {
    ...sharedFieldProps,
    handleUpdate: async (input: UpdateEntityInput) => {
      if ('riskScore' in input && input.riskScore !== undefined) {
        return handleUpdateField({ riskScore: parseInt(String(input.riskScore), 10) || 0 })
      }
      return handleUpdateField(input)
    },
  }

  return (
    <div className="space-y-6">
      {isOverdue && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <Clock size={16} />
          <span className="text-sm font-medium">Review overdue - immediate action required</span>
        </div>
      )}

      {isHighRisk && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">High risk vendor - immediate action required</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Risk summary</h3>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" icon={<CalendarClock size={16} />} iconPosition="left" disabled={!canEdit}>
                  Edit Frequency
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Review Frequency</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={vendor.reviewFrequency ?? ''} onValueChange={(value) => handleUpdateField({ reviewFrequency: value as EntityFrequency })}>
                  {enumToOptions(EntityFrequency).map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button icon={<ClipboardCheck size={16} />} iconPosition="left" disabled={!canEdit} onClick={() => setIsCreateReviewOpen(true)}>
              Review
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <TextField name="tier" label="Risk Tier" {...sharedFieldProps} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <TextField name="riskRating" label="Risk Rating" {...sharedFieldProps} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <TextField name="riskScore" label="Risk Score" type="number" {...riskScoreFieldProps} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <TextField name="renewalRisk" label="Renewal Risk Rating" {...sharedFieldProps} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Review History</h3>
        <DataTable
          columns={reviewHistoryColumns}
          data={reviewsNodes}
          loading={isLoading}
          tableKey={undefined}
          noResultsText="No review history available."
          onRowClick={(row) => setSelectedReviewId(row.id)}
        />
      </div>

      {isCreateReviewOpen && <CreateReviewSheet entityId={vendor.id} onClose={() => setIsCreateReviewOpen(false)} />}
      {selectedReviewId && <ReviewDetailSheet reviewId={selectedReviewId} onClose={() => setSelectedReviewId(null)} />}
    </div>
  )
}

export default RiskReviewTab
