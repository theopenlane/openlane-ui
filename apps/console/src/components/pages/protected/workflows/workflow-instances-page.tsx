'use client'

import { PageHeading } from '@repo/ui/page-heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { formatDateSince } from '@/utils/date'
import { useWorkflowInstancesWithFilter } from '@/lib/graphql-hooks/workflow-instance'
import { WorkflowStatusBadge } from '@/components/workflows/workflow-status-badge'

const WorkflowInstancesPage = () => {
  const { data: instances, isLoading } = useWorkflowInstancesWithFilter({})

  return (
    <>
      <PageHeading
        heading={
          <div>
            <h1>Workflow Instances</h1>
            <p className="text-sm text-muted-foreground">Monitor active workflow runs and assignment status.</p>
          </div>
        }
      />

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">Workflow</TableHead>
              <TableHead className="px-4 py-2">Schema</TableHead>
              <TableHead className="px-4 py-2">Kind</TableHead>
              <TableHead className="px-4 py-2">State</TableHead>
              <TableHead className="px-4 py-2">Assignments</TableHead>
              <TableHead className="px-4 py-2">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading workflow instances...
                </TableCell>
              </TableRow>
            ) : instances?.workflowInstances?.edges?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No workflow instances yet.
                </TableCell>
              </TableRow>
            ) : (
              instances?.workflowInstances?.edges?.map((edge) => {
                const instance = edge?.node
                if (!instance) return null
                const assignments = instance.workflowAssignments?.edges?.map((edge) => edge?.node).filter(Boolean) ?? []
                const pending = assignments.filter((assignment) => assignment?.status === 'PENDING').length
                const approved = assignments.filter((assignment) => assignment?.status === 'APPROVED').length
                const rejected = assignments.filter((assignment) => assignment?.status === 'REJECTED').length
                const changesRequested = assignments.filter((assignment) => String(assignment?.status) === 'CHANGES_REQUESTED').length

                return (
                  <TableRow key={instance.id}>
                    <TableCell className="px-4 py-2 font-medium">{instance.workflowDefinition?.name || 'Workflow'}</TableCell>
                    <TableCell className="px-4 py-2">{instance.workflowDefinition?.schemaType || '—'}</TableCell>
                    <TableCell className="px-4 py-2">{instance.workflowDefinition?.workflowKind || '—'}</TableCell>
                    <TableCell className="px-4 py-2">
                      <WorkflowStatusBadge status={instance.state || 'PENDING'} size="sm" />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">Pending: {pending}</Badge>
                        <Badge variant="outline" className="text-xs">Approved: {approved}</Badge>
                        <Badge variant="outline" className="text-xs">Rejected: {rejected}</Badge>
                        {changesRequested > 0 && <Badge variant="outline" className="text-xs">Changes: {changesRequested}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">{formatDateSince(instance.updatedAt)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {(instances?.workflowInstances?.edges?.length ?? 0) > 0 && (
        <Card className="mt-6 border border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground">
          Instances represent active workflow runs. Approval counts reflect assignments attached to each instance.
        </Card>
      )}
    </>
  )
}

export default WorkflowInstancesPage
