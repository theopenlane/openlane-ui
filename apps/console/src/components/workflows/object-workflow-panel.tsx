'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { WorkflowStatusBadge } from '@/components/workflows/workflow-status-badge'
import {
  useApproveAssignment,
  useRejectAssignment,
  useRequestChangesAssignment,
  useWorkflowInstancesForObject,
  useWorkflowProposalsForObject,
} from '@/lib/graphql-hooks/workflows'
import { useNotification } from '@/hooks/useNotification'
import { definitionHasApprovalAction, definitionHasApprovalTiming, resolveApprovalTiming } from '@/utils/workflow'

type ObjectWorkflowPanelProps = {
  objectId: string
  objectType: string
  objectLabel?: string
}

const formatObjectTypeLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

export function ObjectWorkflowPanel({ objectId, objectType, objectLabel }: ObjectWorkflowPanelProps) {
  const { successNotification, errorNotification } = useNotification()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [changeRequestReason, setChangeRequestReason] = useState('')
  const [changeRequestInputs, setChangeRequestInputs] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showChangeRequestForm, setShowChangeRequestForm] = useState(false)

  const { instances, isLoading, refetch } = useWorkflowInstancesForObject({
    objectId,
    objectType,
    first: 50,
  })

  const { proposals, isLoading: isLoadingProposals } = useWorkflowProposalsForObject({
    objectId,
    objectType,
    includeStates: ['DRAFT', 'SUBMITTED', 'APPLIED', 'REJECTED', 'SUPERSEDED'],
  })

  const approveMutation = useApproveAssignment()
  const rejectMutation = useRejectAssignment()
  const requestChangesMutation = useRequestChangesAssignment()

  const pendingAssignments = useMemo(() => {
    const assignments: any[] = []
    if (!instances || !Array.isArray(instances)) return assignments

    instances.forEach((instance) => {
      const instanceAssignments = instance.workflowAssignments?.edges?.map((edge) => edge?.node).filter(Boolean) || []
      instanceAssignments.forEach((assignment) => {
        if (assignment?.status === 'PENDING') {
          assignments.push({
            ...assignment,
            workflowInstance: {
              id: instance.id,
              state: instance.state,
              context: instance.context,
              workflowDefinition: instance.workflowDefinition,
            },
          })
        }
      })
    })
    return assignments
  }, [instances])

  const resetDecisionState = () => {
    setSelectedAssignmentId(null)
    setRejectReason('')
    setChangeRequestReason('')
    setChangeRequestInputs('')
    setShowRejectForm(false)
    setShowChangeRequestForm(false)
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
      await rejectMutation.mutateAsync({ id: assignmentId, reason: rejectReason })
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
      errorNotification({ title: 'Unable to request changes', description: error instanceof Error ? error.message : 'Something went wrong.' })
    }
  }

  const hasProposals = proposals.length > 0

  if (isLoading && pendingAssignments.length === 0 && !hasProposals) {
    return null
  }

  if (pendingAssignments.length === 0 && !hasProposals && !isLoadingProposals) {
    return null
  }

  const objectTypeLabel = formatObjectTypeLabel(objectType)
  const headerTitle = pendingAssignments.length > 0 ? 'Pending Approvals' : 'Workflow Proposals'
  const headerDescription =
    pendingAssignments.length > 0
      ? objectLabel
        ? `${objectLabel} requires your action`
        : `This ${objectTypeLabel.toLowerCase()} requires your action`
      : objectLabel
        ? `${objectLabel} has staged workflow proposals`
        : `This ${objectTypeLabel.toLowerCase()} has staged workflow proposals`
  const headerCount = pendingAssignments.length > 0 ? pendingAssignments.length : proposals.length
  const headerCountLabel =
    pendingAssignments.length > 0
      ? 'pending'
      : proposals.length === 1
        ? 'proposal'
        : 'proposals'

  return (
    <Card className="border-amber-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              {headerTitle}
            </CardTitle>
            <CardDescription>{headerDescription}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-amber-600">
            {headerCount} {headerCountLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingAssignments.map((assignment) => {
          const definitionDoc =
            assignment.workflowInstance?.workflowDefinition?.definitionJSON ?? assignment.workflowInstance?.definitionSnapshot
          const hasApprovalAction = definitionHasApprovalAction(definitionDoc)
          const hasApprovalTiming = definitionHasApprovalTiming(definitionDoc)
          const approvalTiming = hasApprovalAction || hasApprovalTiming ? resolveApprovalTiming(definitionDoc) : undefined
          const isPostCommit = approvalTiming === 'POST_COMMIT'
          const proposedChanges = (assignment.workflowInstance?.context as { triggerProposedChanges?: Record<string, unknown> } | undefined)
            ?.triggerProposedChanges
          const proposedChangesText =
            proposedChanges && Object.keys(proposedChanges).length > 0 ? JSON.stringify(proposedChanges, null, 2) : ''

          return (
            <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{assignment.label || assignment.assignmentKey}</p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.workflowInstance?.workflowDefinition?.name || 'Workflow'}
                  </p>
                  {assignment.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <WorkflowStatusBadge status={assignment.status || 'PENDING'} size="sm" />
                  {(hasApprovalAction || hasApprovalTiming) && isPostCommit && <Badge variant="outline" className="text-xs">Post-commit</Badge>}
                </div>
              </div>

              {assignment.metadata && typeof assignment.metadata === 'object' && (
                <div className="text-sm">
                  {Object.entries(assignment.metadata).map(([key, value]) => (
                    <div key={key} className="text-xs text-muted-foreground">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}

              {(hasApprovalAction || hasApprovalTiming) && (
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

              {showChangeRequestForm && selectedAssignmentId === assignment.id ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Change request</Label>
                    <Textarea
                      value={changeRequestReason}
                      onChange={(e) => setChangeRequestReason(e.target.value)}
                      placeholder="Describe what needs to be updated"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inputs (JSON)</Label>
                    <Textarea
                      value={changeRequestInputs}
                      onChange={(e) => setChangeRequestInputs(e.target.value)}
                      placeholder='{"field":"value"}'
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRequestChanges(assignment.id)} disabled={requestChangesMutation.isPending}>
                      {requestChangesMutation.isPending ? 'Requesting...' : 'Request changes'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => resetDecisionState()}>
                      Cancel
                    </Button>
                  </div>
                </div>
            ) : showRejectForm && selectedAssignmentId === assignment.id ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Rejection Reason</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => handleReject(assignment.id)} disabled={rejectMutation.isPending}>
                    {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
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
              <div className="flex gap-2">
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
                    setShowRejectForm(true)
                    setShowChangeRequestForm(false)
                    setRejectReason('')
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
            </div>
          )
        })}

        {hasProposals && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Workflow proposals</p>
                <p className="text-xs text-muted-foreground">Staged changes for this {objectTypeLabel.toLowerCase()}.</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {proposals.length} proposal{proposals.length === 1 ? '' : 's'}
              </Badge>
            </div>

            {proposals.map((proposal) => {
              const changesObject =
                proposal.changes && typeof proposal.changes === 'object' && !Array.isArray(proposal.changes) ? proposal.changes : null
              const proposalChanges = changesObject && Object.keys(changesObject).length > 0 ? JSON.stringify(changesObject, null, 2) : ''
              const stateLabel = String(proposal.state || 'UNKNOWN').replace(/_/g, ' ').toLowerCase()
              const stateDisplay = stateLabel.charAt(0).toUpperCase() + stateLabel.slice(1)
              const proposalIdSuffix = proposal.id ? proposal.id.slice(-6) : ''
              const updatedAt = proposal.updatedAt || proposal.createdAt

              return (
                <div key={proposal.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Proposal {proposalIdSuffix ? `…${proposalIdSuffix}` : ''}
                      </p>
                      {proposal.domainKey && <p className="text-xs text-muted-foreground">Domain: {proposal.domainKey}</p>}
                      {updatedAt && (
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stateDisplay}
                    </Badge>
                  </div>

                  {proposalChanges ? (
                    <pre className="text-xs rounded-md bg-muted/40 p-3 whitespace-pre-wrap">{proposalChanges}</pre>
                  ) : (
                    <p className="text-xs text-muted-foreground">No proposal changes recorded.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
