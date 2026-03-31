'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PageHeading } from '@repo/ui/page-heading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { CheckCircle, UserPlus, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useOrganization } from '@/hooks/useOrganization'
import { useApproveAssignment, useReassignAssignment, useRejectAssignment, useRequestChangesAssignment } from '@/lib/graphql-hooks/workflows'
import { useWorkflowAssignmentsWithFilter } from '@/lib/graphql-hooks/workflow-assignment'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { OrderDirection, WorkflowAssignment, WorkflowAssignmentOrderField, WorkflowAssignmentWhereInput, WorkflowAssignmentWorkflowAssignmentStatus } from '@repo/codegen/src/schema'
import { WorkflowStatusBadge } from '@/components/workflows/workflow-status-badge'
import { useNotification } from '@/hooks/useNotification'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { definitionHasApprovalAction, definitionHasApprovalTiming, definitionHasReviewAction, resolveApprovalTiming } from '@/utils/workflow'

const WorkflowInboxPage = () => {
  const router = useRouter()
  const { data: sessionData } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const userId = sessionData?.user?.userId

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [changeRequestReason, setChangeRequestReason] = useState('')
  const [changeRequestInputs, setChangeRequestInputs] = useState('')
  const [reassignUserId, setReassignUserId] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangeRequestForm, setShowChangeRequestForm] = useState(false)
  const [showReassignForm, setShowReassignForm] = useState(false)

  const where = useMemo(() => {
    if (!userId) return undefined
    const filter: WorkflowAssignmentWhereInput = {
      status: WorkflowAssignmentWorkflowAssignmentStatus.PENDING,
      hasWorkflowAssignmentTargetsWith: [{ targetUserID: userId }],
    }
    return filter
  }, [userId])

  const { data: assignments, isLoading, refetch } = useWorkflowAssignmentsWithFilter({
    where,
    orderBy: [{ field: WorkflowAssignmentOrderField.created_at, direction: OrderDirection.DESC }],
  })

  const approveMutation = useApproveAssignment()
  const reassignMutation = useReassignAssignment()
  const rejectMutation = useRejectAssignment()
  const requestChangesMutation = useRequestChangesAssignment()
  const { userOptions, isLoading: isLoadingUsers } = useUserSelect({})

  const { approvalAssignments, reviewAssignments, changeRequestAssignments } = useMemo(() => {
    const approvals: WorkflowAssignment[] = []
    const reviews: WorkflowAssignment[] = []
    const changeRequests: WorkflowAssignment[] = []

    assignments?.workflowAssignments.edges?.forEach((assignment) => {
      if (!assignment?.node) return

      const role = (assignment.node.role || '').toUpperCase()
      const key = assignment.node.assignmentKey || ''
      const isChangeRequest = role === 'REQUESTER' || key.startsWith('change_request_')
      const definitionDoc = assignment.node.workflowInstance?.workflowDefinition?.definitionJSON ?? assignment.node.workflowInstance?.definitionSnapshot
      const workflowKind = (assignment.node.workflowInstance?.workflowDefinition?.workflowKind || '').toUpperCase()
      const hasApprovalAction = definitionHasApprovalAction(definitionDoc)
      const hasApprovalTiming = definitionHasApprovalTiming(definitionDoc)
      const hasReviewAction = definitionHasReviewAction(definitionDoc)
      const isApprovalWorkflow = hasApprovalAction || hasApprovalTiming || (workflowKind === 'APPROVAL' && !hasReviewAction)
      const isReview = hasReviewAction || (!isApprovalWorkflow && (role === 'REVIEWER' || key.startsWith('review_')))

      if (isChangeRequest) {
        changeRequests.push(assignment.node as WorkflowAssignment)
      } else if (isApprovalWorkflow) {
        approvals.push(assignment.node as WorkflowAssignment)
      } else if (isReview) {
        reviews.push(assignment.node as WorkflowAssignment)
      } else {
        approvals.push(assignment.node as WorkflowAssignment)
      }
    })

    return {
      approvalAssignments: approvals,
      reviewAssignments: reviews,
      changeRequestAssignments: changeRequests,
    }
  }, [assignments])

  const pendingCount = approvalAssignments.length + reviewAssignments.length + changeRequestAssignments.length

  const resetDecisionState = () => {
    setSelectedAssignmentId(null)
    setRejectReason('')
    setChangeRequestReason('')
    setChangeRequestInputs('')
    setReassignUserId('')
    setShowRejectForm(false)
    setShowChangeRequestForm(false)
    setShowReassignForm(false)
  }

  const parseInputsPayload = () => {
    if (!changeRequestInputs.trim()) return undefined
    try {
      const parsed = JSON.parse(changeRequestInputs)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        errorNotification({
          title: 'Invalid inputs',
          description: 'Inputs must be a JSON object.',
        })
        return null
      }
      return parsed
    } catch (error) {
      errorNotification({
        title: 'Invalid JSON',
        description: 'Please provide valid JSON for the change request inputs.',
      })
      return null
    }
  }

  const resolveAssignmentHref = (assignment: WorkflowAssignment) => {
    const instance = assignment.workflowInstance
    if (!instance) return ''

    const context = instance.context as { objectType?: string; objectId?: string } | undefined
    const objectType = context?.objectType || instance.workflowDefinition?.schemaType
    const objectId = context?.objectId || instance.controlID || instance.subcontrolID || instance.evidenceID || instance.internalPolicyID || instance.procedureID

    if (!objectType || !objectId) return ''

    const typeMap: Record<string, string> = {
      Control: 'controls',
      Subcontrol: 'subcontrols',
      Evidence: 'evidences',
      InternalPolicy: 'policies',
      Procedure: 'procedures',
    }

    const kind = typeMap[objectType]
    if (!kind) return ''

    if (kind === 'subcontrols' && !instance.controlID) {
      return ''
    }

    return getHrefForObjectType(kind, {
      id: objectId,
      controlId: instance.controlID ?? undefined,
    })
  }

  const handleApprove = async (assignmentId: string) => {
    try {
      await approveMutation.mutateAsync({ id: assignmentId })
      await refetch()
      successNotification({ title: 'Approved', description: 'The approval was recorded.' })
      resetDecisionState()
    } catch (error) {
      errorNotification({ title: 'Unable to approve', description: error instanceof Error ? error.message : 'Something went wrong.' })
    }
  }

  const handleReject = async (assignmentId: string) => {
    try {
      await rejectMutation.mutateAsync({ id: assignmentId, reason: rejectReason || undefined })
      await refetch()
      successNotification({ title: 'Rejected', description: 'The rejection was recorded.' })
      resetDecisionState()
    } catch (error) {
      errorNotification({ title: 'Unable to reject', description: error instanceof Error ? error.message : 'Something went wrong.' })
    }
  }

  const handleRequestChanges = async (assignmentId: string) => {
    const inputsPayload = parseInputsPayload()
    if (inputsPayload === null) return

    try {
      await requestChangesMutation.mutateAsync({
        id: assignmentId,
        reason: changeRequestReason || undefined,
        inputs: inputsPayload as Record<string, unknown> | undefined,
      })
      await refetch()
      successNotification({ title: 'Changes requested', description: 'The request was sent to the originator.' })
      resetDecisionState()
    } catch (error) {
      errorNotification({
        title: 'Unable to request changes',
        description: error instanceof Error ? error.message : 'Something went wrong.',
      })
    }
  }

  const handleReassign = async (assignmentId: string) => {
    if (!reassignUserId) {
      errorNotification({ title: 'Select a user', description: 'Choose a user to add as an approver.' })
      return
    }

    try {
      await reassignMutation.mutateAsync({ id: assignmentId, targetUserID: reassignUserId })
      await refetch()
      successNotification({ title: 'Approver added', description: 'The additional approval was assigned.' })
      resetDecisionState()
    } catch (error) {
      errorNotification({
        title: 'Unable to reassign',
        description: error instanceof Error ? error.message : 'Something went wrong.',
      })
    }
  }

  const renderAssignmentCard = (assignment: WorkflowAssignment, allowDecision: boolean) => {
    const definition = assignment.workflowInstance?.workflowDefinition
    const instanceState = assignment.workflowInstance?.state
    const role = (assignment.role || '').toUpperCase()
    const definitionDoc = definition?.definitionJSON ?? assignment.workflowInstance?.definitionSnapshot
    const hasApprovalAction = definitionHasApprovalAction(definitionDoc)
    const hasApprovalTiming = definitionHasApprovalTiming(definitionDoc)
    const hasReviewAction = definitionHasReviewAction(definitionDoc)
    const approvalTiming = hasApprovalAction || hasApprovalTiming ? resolveApprovalTiming(definitionDoc) : undefined
    const isPostCommit = approvalTiming === 'POST_COMMIT'
    const workflowKind = (definition?.workflowKind || '').toUpperCase()
    const isApprovalWorkflow = hasApprovalAction || hasApprovalTiming || (workflowKind === 'APPROVAL' && !hasReviewAction)
    const isReview = hasReviewAction || (!isApprovalWorkflow && (role === 'REVIEWER' || assignment.assignmentKey?.startsWith('review_')))
    const changeReason =
      (assignment.rejectionMetadata as { rejectionReason?: string } | undefined)?.rejectionReason || (assignment.metadata as { change_request_reason?: string } | undefined)?.change_request_reason
    const changeInputs =
      (assignment.metadata as { change_request_inputs?: unknown } | undefined)?.change_request_inputs ||
      (assignment.rejectionMetadata as { change_request_inputs?: unknown } | undefined)?.change_request_inputs
    const changeInputsText = changeInputs && typeof changeInputs === 'string' ? changeInputs : changeInputs ? JSON.stringify(changeInputs, null, 2) : ''
    const assignmentHref = resolveAssignmentHref(assignment)
    const targetUserIds = assignment.workflowAssignmentTargets?.edges?.map((edge) => edge?.node?.targetUserID).filter(Boolean) as string[] | undefined
    const availableUsers = userOptions.filter((user) => !targetUserIds?.includes(user.value))
    const proposedChanges = (assignment.workflowInstance?.context as { triggerProposedChanges?: Record<string, unknown> } | undefined)?.triggerProposedChanges
    const proposedChangesText = proposedChanges && Object.keys(proposedChanges).length > 0 ? JSON.stringify(proposedChanges, null, 2) : ''

    return (
      <Card key={assignment.id} className="border border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base">{assignment.label || assignment.assignmentKey}</CardTitle>
              <CardDescription>
                {definition?.name || 'Workflow'} • {definition?.schemaType || 'Schema'}
              </CardDescription>
              {assignment.createdAt && <p className="text-xs text-muted-foreground">Requested {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <WorkflowStatusBadge status={assignment.status || 'PENDING'} size="sm" />
              {(hasApprovalAction || hasApprovalTiming) && isPostCommit && (
                <Badge variant="outline" className="text-xs">
                  Post-commit
                </Badge>
              )}
              {instanceState && (
                <Badge variant="outline" className="text-xs">
                  {instanceState}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {allowDecision && (hasApprovalAction || hasApprovalTiming) && (
            <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Proposed changes</p>
              {isPostCommit ? (
                <p className="text-xs text-muted-foreground">No proposal for post-commit approvals.</p>
              ) : proposedChangesText ? (
                <pre className="mt-2 text-xs rounded-md bg-muted/40 p-3 whitespace-pre-wrap">{proposedChangesText}</pre>
              ) : (
                <p className="text-xs text-muted-foreground">No proposal details available.</p>
              )}
            </div>
          )}
          {!allowDecision ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Changes requested. Update the item and resubmit when ready.</p>
              {changeReason && <p className="text-xs">Reason: {changeReason}</p>}
              {changeInputsText && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Requested inputs</p>
                  <pre className="text-xs rounded-md bg-muted/40 p-3 whitespace-pre-wrap">{changeInputsText}</pre>
                </div>
              )}
              {assignmentHref && (
                <Button size="sm" variant="outline" onClick={() => router.push(assignmentHref)}>
                  Open item
                </Button>
              )}
            </div>
          ) : showChangeRequestForm && selectedAssignmentId === assignment.id ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Change request</Label>
                <Textarea value={changeRequestReason} onChange={(e) => setChangeRequestReason(e.target.value)} placeholder="Describe what needs to be updated" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Inputs (JSON)</Label>
                <Textarea value={changeRequestInputs} onChange={(e) => setChangeRequestInputs(e.target.value)} placeholder='{"field":"value"}' rows={3} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleRequestChanges(assignment.id)} disabled={requestChangesMutation.isPending}>
                  {requestChangesMutation.isPending ? 'Requesting...' : 'Request changes'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    resetDecisionState()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : showReassignForm && selectedAssignmentId === assignment.id ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{isReview ? 'Add reviewer' : 'Add approver'}</Label>
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Everyone eligible is already assigned.</p>
                ) : (
                  <Select value={reassignUserId} onValueChange={setReassignUserId}>
                    <SelectTrigger disabled={isLoadingUsers}>
                      <SelectValue placeholder={isLoadingUsers ? 'Loading users...' : 'Select user'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.value} value={user.value}>
                          {user.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleReassign(assignment.id)} disabled={reassignMutation.isPending || !reassignUserId || availableUsers.length === 0}>
                  {reassignMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resetDecisionState()}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : showRejectForm && selectedAssignmentId === assignment.id ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Rejection reason</Label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional reason for rejection" rows={3} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => handleReject(assignment.id)} disabled={rejectMutation.isPending}>
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm rejection'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    resetDecisionState()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleApprove(assignment.id)} disabled={approveMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedAssignmentId(assignment.id)
                  setShowChangeRequestForm(true)
                  setShowRejectForm(false)
                  setShowReassignForm(false)
                  setChangeRequestReason('')
                  setChangeRequestInputs('')
                }}
              >
                Request changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAssignmentId(assignment.id)
                  setShowReassignForm(true)
                  setShowRejectForm(false)
                  setShowChangeRequestForm(false)
                  setReassignUserId('')
                }}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {isReview ? 'Add reviewer' : 'Add approver'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAssignmentId(assignment.id)
                  setShowRejectForm(true)
                  setShowChangeRequestForm(false)
                  setShowReassignForm(false)
                  setRejectReason('')
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderSection = (title: string, description: string, items: WorkflowAssignment[], allowDecision = true) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="text-amber-600">
          {items.length} pending
        </Badge>
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">Nothing pending right now.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">{items.map((assignment) => renderAssignmentCard(assignment, allowDecision))}</div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeading
        heading={
          <div className="flex items-center justify-between">
            <div>
              <h1>Workflow Inbox</h1>
              <p className="text-md text-muted-foreground">Review approvals, reviews, and requested changes assigned to you.</p>
            </div>
            <Badge variant="secondary" className="text-[var(--color-warning)]">
              {pendingCount} pending
            </Badge>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading workflow assignments...</p>
      ) : assignments?.workflowAssignments?.edges?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">No pending assignments right now.</CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {renderSection('Approvals', 'Decide on approvals that require a decision before work proceeds.', approvalAssignments)}
          {renderSection('Reviews', 'Provide review decisions for workflow requests.', reviewAssignments)}
          {changeRequestAssignments.length > 0 && renderSection('Changes requested', 'Address requested changes and update the item before resubmitting.', changeRequestAssignments, false)}
        </div>
      )}
    </div>
  )
}

export default WorkflowInboxPage
