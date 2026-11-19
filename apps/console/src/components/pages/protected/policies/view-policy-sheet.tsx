'use client'

import React, { useCallback, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { DocumentStatusBadge } from '@/components/shared/enum-mapper/policy-enum'
import PlateEditor from '@/components/shared/plate/plate-editor'
import CommentsSection from '@/components/shared/comments/comments-section'
import { useGetInternalPolicyDetailsById, useGetPolicyDiscussionById, usePolicyComments } from '@/lib/graphql-hooks/internal-policy'
import { type Value } from 'platejs'
import { type Group, type InternalPolicyByIdFragment, InternalPolicyDocumentManagementMode } from '@repo/codegen/src/schema'
import { GenericDetailsSheet, type RenderFieldsProps, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { SlideoutPreviewHeader } from '@/components/shared/crud-base/slideout-preview-header'
import IntegrationDocumentView from '@/components/pages/protected/policies/view/fields/integration-document-view'
import ExternalReferenceView from '@/components/pages/protected/policies/view/fields/external-reference-view'
import { useForm } from 'react-hook-form'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type Props = {
  policyId: string | null
  onClose: () => void
}

export const ViewPolicySheet: React.FC<Props> = ({ policyId, onClose }) => {
  const [detailsOpen, setDetailsOpen] = useState(true)
  const form = useForm()
  const normalizeData = useCallback(() => ({}), [])
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId, !!policyId)
  const { data: discussionData } = useGetPolicyDiscussionById(policyId)
  const comments = usePolicyComments(policyId)

  const policy = data?.internalPolicy

  const renderHeader = useCallback(({ close }: RenderHeaderProps) => <SlideoutPreviewHeader title="Policy" close={close} fullPagePath={policyId ? `/policies/${policyId}/view` : null} />, [policyId])

  const renderFields = useCallback(
    ({ data: p }: RenderFieldsProps<InternalPolicyByIdFragment, never>) => {
      if (!p) return null
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            {p.status && <DocumentStatusBadge status={p.status} />}
          </div>

          {p.approver && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Approver</p>
              <div className="flex items-center gap-2">
                <Avatar entity={p.approver as Group} />
                <span className="text-sm">{p.approver.displayName}</span>
              </div>
            </div>
          )}

          <div>
            <button className="flex items-center gap-1 text-sm font-medium w-full text-left mb-2" onClick={() => setDetailsOpen((o) => !o)}>
              {detailsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Details
            </button>
            {detailsOpen &&
              (p.managementMode === InternalPolicyDocumentManagementMode.INTEGRATION ? (
                <IntegrationDocumentView policy={p} />
              ) : p.managementMode === InternalPolicyDocumentManagementMode.EXTERNAL_REFERENCE && p.file ? (
                <ExternalReferenceView policy={p} editAllowed={false} />
              ) : (
                <PlateEditor
                  key={JSON.stringify(p.detailsJSON ?? p.details)}
                  initialValue={p.detailsJSON ? (p.detailsJSON as Value) : (p.details ?? undefined)}
                  entity={discussionData?.internalPolicy}
                  readonly={true}
                  variant="readonly"
                  toolbarClassName="hidden"
                />
              ))}
          </div>
        </div>
      )
    },
    [detailsOpen, discussionData],
  )

  const commentsSection = (
    <div className="px-1 pb-4">
      <CommentsSection key={policyId} {...comments} />
    </div>
  )

  return (
    <GenericDetailsSheet
      objectType={ObjectTypes.INTERNAL_POLICY}
      form={form}
      entityId={policyId}
      data={policy}
      isFetching={isLoading}
      normalizeData={normalizeData}
      onClose={onClose}
      basePath="/policies"
      renderHeader={renderHeader}
      renderFields={renderFields}
      extraContent={commentsSection}
    />
  )
}
