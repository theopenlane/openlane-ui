'use client'

import React, { useMemo, useState } from 'react'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useGetInternalPolicyHistories, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
import { type InternalPolicyByIdFragment, InternalPolicyDocumentStatus, InternalPolicyFrequency, type UpdateInternalPolicyInput, type ApiToken, type User } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import HistoryRow from './history-row'
import VersionSlideout from './version-slideout'
import RestoreDialog from './restore-dialog'
import { stringToPlateValue } from '@/components/shared/plate/plate-utils'

const hasStr = (s: string | null | undefined): s is string => typeof s === 'string' && s.length > 0
const hasArr = (a: ReadonlyArray<unknown> | null | undefined): a is ReadonlyArray<unknown> => Array.isArray(a) && a.length > 0

type HistoryTabProps = {
  policyId: string
  policy: InternalPolicyByIdFragment
}

const HistoryTab: React.FC<HistoryTabProps> = ({ policyId, policy }) => {
  const { data, isLoading } = useGetInternalPolicyHistories(policyId)
  const { mutateAsync: updatePolicy, isPending: isRestoring } = useUpdateInternalPolicy()
  const { successNotification, errorNotification } = useNotification()

  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null)

  const historyNodes = useMemo(() => {
    return (data?.internalPolicyHistories?.edges ?? []).map((edge) => edge?.node).filter((n): n is NonNullable<typeof n> => n != null && n.revision !== policy.revision)
  }, [data, policy.revision])

  const userIds = useMemo(() => {
    const ids = new Set<string>()
    if (policy.updatedBy) ids.add(policy.updatedBy)
    if (policy.createdBy) ids.add(policy.createdBy)
    historyNodes.forEach((n) => {
      if (n.createdBy) ids.add(n.createdBy)
      if (n.updatedBy) ids.add(n.updatedBy)
    })
    return Array.from(ids)
  }, [policy.updatedBy, policy.createdBy, historyNodes])

  const userListWhere = useMemo(() => ({ hasUserWith: [{ idIn: userIds }] }), [userIds])
  const tokenListWhere = useMemo(() => ({ idIn: userIds }), [userIds])

  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokenListWhere })

  const userMap = useMemo(() => {
    const m = new Map<string, User>()
    users?.forEach((u) => u?.id && m.set(u.id, u))
    return m
  }, [users])

  const tokenMap = useMemo(() => {
    const m = new Map<string, ApiToken>()
    tokens?.forEach((t) => t?.id && m.set(t.id, t))
    return m
  }, [tokens])

  const lookupAuthor = (id: string | null | undefined): { user?: User; token?: ApiToken } => {
    if (!id) return {}
    const token = tokenMap.get(id)
    if (token) return { token }
    const user = userMap.get(id)
    return user ? { user } : {}
  }

  const restoreTarget = useMemo(() => historyNodes.find((n) => n.id === restoreTargetId) ?? null, [historyNodes, restoreTargetId])

  const handleRestore = async (historyId: string) => {
    const target = historyNodes.find((n) => n.id === historyId)
    if (!target) return
    const hasDetailsJSON = Array.isArray(target.detailsJSON) && target.detailsJSON.length > 0
    const derivedDetailsJSON = hasDetailsJSON ? target.detailsJSON : stringToPlateValue(target.details)

    const input: UpdateInternalPolicyInput = {
      status: InternalPolicyDocumentStatus.NEEDS_APPROVAL,
      ...(hasStr(target.name) && { name: target.name }),
      ...(hasStr(target.details) && { details: target.details }),
      ...(derivedDetailsJSON ? { detailsJSON: derivedDetailsJSON } : { clearDetailsJSON: true }),
      ...(hasArr(target.tags) ? { tags: target.tags as string[] } : hasArr(policy.tags) ? { clearTags: true } : {}),
      ...(target.approvalRequired != null ? { approvalRequired: target.approvalRequired } : policy.approvalRequired != null ? { clearApprovalRequired: true } : {}),
      ...(target.reviewDue != null ? { reviewDue: target.reviewDue } : policy.reviewDue != null ? { clearReviewDue: true } : {}),
      ...(target.reviewFrequency != null
        ? { reviewFrequency: InternalPolicyFrequency[target.reviewFrequency as keyof typeof InternalPolicyFrequency] }
        : policy.reviewFrequency != null
          ? { clearReviewFrequency: true }
          : {}),
      ...(hasStr(target.approverID) ? { approverID: target.approverID } : policy.approver?.id ? { clearApprover: true } : {}),
      ...(hasStr(target.delegateID) ? { delegateID: target.delegateID } : policy.delegate?.id ? { clearDelegate: true } : {}),
      ...(hasStr(target.internalPolicyKindName) ? { internalPolicyKindName: target.internalPolicyKindName } : hasStr(policy.internalPolicyKindName) ? { clearInternalPolicyKindName: true } : {}),
    }
    try {
      await updatePolicy({ updateInternalPolicyId: policyId, input })
      successNotification({ title: 'Policy restored', description: `Restored ${target.revision ?? ''}`.trim() })
      setRestoreTargetId(null)
      setSelectedHistoryId(null)
    } catch (e) {
      errorNotification({ title: 'Restore failed', description: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  const currentAuthor = lookupAuthor(policy.updatedBy)

  return (
    <div className="mt-5 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Showing major and minor versions only · patch versions (e.g. v1.2.1) excluded</p>

      <HistoryRow id={policyId} revision={policy.revision} occurredAt={policy.updatedAt} user={currentAuthor.user} token={currentAuthor.token} isCurrent />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : historyNodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prior major or minor versions.</p>
      ) : (
        historyNodes.map((node) => {
          const author = lookupAuthor(node.createdBy ?? node.updatedBy)
          return (
            <HistoryRow
              key={node.id}
              id={node.id}
              revision={node.revision}
              occurredAt={node.historyTime}
              user={author.user}
              token={author.token}
              onView={(id) => setSelectedHistoryId(id)}
              onRestore={(id) => setRestoreTargetId(id)}
            />
          )
        })
      )}

      <div className="pt-2">
        <Button type="button" variant="transparent" disabled aria-disabled>
          View all versions including patches
        </Button>
      </div>

      <VersionSlideout historyId={selectedHistoryId} histories={historyNodes} currentPolicy={policy} onClose={() => setSelectedHistoryId(null)} onRestore={(id) => setRestoreTargetId(id)} />

      <RestoreDialog
        open={!!restoreTarget}
        onOpenChange={(open) => {
          if (!open) setRestoreTargetId(null)
        }}
        revision={restoreTarget?.revision ?? ''}
        onConfirm={() => restoreTarget && handleRestore(restoreTarget.id)}
        isPending={isRestoring}
      />
    </div>
  )
}

export default HistoryTab
