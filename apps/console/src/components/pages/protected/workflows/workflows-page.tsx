'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { formatDateSince } from '@/utils/date'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteWorkflowDefinition, useWorkflowDefinitionsWithFilter } from '@/lib/graphql-hooks/workflows'

const WorkflowsPage = () => {
  const router = useRouter()
  const { definitions, isLoading } = useWorkflowDefinitionsWithFilter({})
  const deleteMutation = useDeleteWorkflowDefinition()
  const { successNotification, errorNotification } = useNotification()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      successNotification({
        title: 'Workflow deleted',
        description: 'The workflow definition was removed successfully.',
      })
    } catch (error) {
      errorNotification({
        title: 'Unable to delete workflow',
        description: error instanceof Error ? error.message : 'Something went wrong.',
      })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <>
      <PageHeading
        heading={
          <div className="flex items-center justify-between">
            <div>
              <h1>Workflows</h1>
              <p className="text-sm text-muted-foreground">Automate approvals, notifications, and lifecycle actions.</p>
            </div>
            <Button onClick={() => router.push('/workflows/editor')}>Create workflow</Button>
          </div>
        }
      />

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">Name</TableHead>
              <TableHead className="px-4 py-2">Schema</TableHead>
              <TableHead className="px-4 py-2">Kind</TableHead>
              <TableHead className="px-4 py-2">Status</TableHead>
              <TableHead className="px-4 py-2">Updated</TableHead>
              <TableHead className="px-4 py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading workflows...
                </TableCell>
              </TableRow>
            ) : definitions.length > 0 ? (
              definitions.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="px-4 py-2 font-medium">{workflow.name}</TableCell>
                  <TableCell className="px-4 py-2">{workflow.schemaType}</TableCell>
                  <TableCell className="px-4 py-2">{workflow.workflowKind}</TableCell>
                  <TableCell className="px-4 py-2">
                    {workflow.draft ? 'Draft' : workflow.active ? 'Active' : 'Inactive'}
                    {workflow.isDefault ? ' / Default' : ''}
                  </TableCell>
                  <TableCell className="px-4 py-2">{formatDateSince(workflow.updatedAt)}</TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => router.push(`/workflows/definitions/${workflow.id}`)}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/workflows/editor?id=${workflow.id}`)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="transparent" onClick={() => setDeleteId(workflow.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No workflow definitions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete workflow"
        description="This action cannot be undone. This workflow definition will be permanently removed."
      />
    </>
  )
}

export default WorkflowsPage
