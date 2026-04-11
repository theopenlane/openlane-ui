'use client'

import React, { useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type VisibilityState } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { AlertTriangle, Clock, ClipboardCheck, CalendarClock, SearchIcon, CircleHelp } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@repo/ui/dropdown-menu'
import { type GetRiskByIdQuery, RiskFrequency, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import type { WhereCondition } from '@/types'
import { reviewHistoryColumns, isHighRiskTier, mappedReviewColumns, DEFAULT_VISIBILITY, REVIEW_FILTER_FIELDS } from '@/components/pages/protected/reviews/common/risk-review-config'
import CreateReviewSheet from '@/components/pages/protected/reviews/common/create-review-sheet'
import ReviewDetailSheet from '@/components/pages/protected/reviews/common/review-detail-sheet'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { RiskLikelihoodOptions } from '@/components/shared/enum-mapper/risk-enum'

const iconClass = 'h-4 w-4 text-muted-foreground'

interface RiskReviewTabProps {
  risk: GetRiskByIdQuery['risk']
  handleUpdateField: (input: UpdateRiskInput) => Promise<void>
  canEdit: boolean
  isEditing: boolean
}

const RiskReviewTab: React.FC<RiskReviewTabProps> = ({ risk, handleUpdateField, canEdit, isEditing }) => {
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.RISK_REVIEWS, DEFAULT_VISIBILITY))
  const [filterWhere, setFilterWhere] = useState<WhereCondition>({})

  const debouncedSearch = useDebounce(searchTerm, 300)
  const searchFields = debouncedSearch ? { or: [{ titleContainsFold: debouncedSearch }, { summaryContainsFold: debouncedSearch }, { reporterContainsFold: debouncedSearch }] } : {}

  const { reviewsNodes, isLoading } = useReviewsWithFilter({
    where: { hasRisksWith: [{ id: risk.id }], ...filterWhere, ...searchFields },
  })

  const isOverdue = risk.nextReviewDueAt && new Date(risk.nextReviewDueAt) < new Date()
  const isHighRisk = isHighRiskTier(risk.impact)

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEdit,
    isCreate: false,
    data: risk,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  const riskScoreFieldProps = {
    ...sharedFieldProps,
    handleUpdate: async (input: UpdateRiskInput) => {
      if ('score' in input && input.score !== undefined) {
        return handleUpdateField({ score: parseInt(String(input.score), 10) || 0 })
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
          <span className="text-sm font-medium">High risk - immediate action required</span>
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
                <DropdownMenuRadioGroup value={risk.reviewFrequency ?? ''} onValueChange={(value) => handleUpdateField({ reviewFrequency: value as RiskFrequency })}>
                  {enumToOptions(RiskFrequency).map((option) => (
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
              <SelectField
                name="likelihood"
                label="Likelihood"
                icon={<CircleHelp className={iconClass} />}
                options={RiskLikelihoodOptions}
                useCustomDisplay={false}
                renderValue={(value) => (
                  <div className="flex items-center space-x-2 text-sm">
                    <span>{getEnumLabel(value)}</span>
                  </div>
                )}
                {...sharedFieldProps}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <TextField type="number" name="score" label="Risk Score" {...riskScoreFieldProps} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <TextField type="number" name="residualScore" label="Residual Score" {...sharedFieldProps} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Review History</h3>
        <div className="flex items-center gap-2 mb-3">
          <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />
          <div className="grow flex flex-row items-center gap-2 justify-end">
            <ColumnVisibilityMenu mappedColumns={mappedReviewColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.RISK_REVIEWS} />
            <TableFilter filterFields={REVIEW_FILTER_FIELDS} onFilterChange={setFilterWhere} pageKey={TableKeyEnum.RISK_REVIEWS} />
          </div>
        </div>
        <DataTable
          columns={reviewHistoryColumns}
          data={reviewsNodes}
          loading={isLoading}
          tableKey={TableKeyEnum.RISK_REVIEWS}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          noResultsText="No review history available."
          onRowClick={(row) => setSelectedReviewId(row.id)}
        />
      </div>

      {isCreateReviewOpen && <CreateReviewSheet riskId={risk.id} onClose={() => setIsCreateReviewOpen(false)} />}
      {selectedReviewId && <ReviewDetailSheet reviewId={selectedReviewId} onClose={() => setSelectedReviewId(null)} />}
    </div>
  )
}

export default RiskReviewTab
