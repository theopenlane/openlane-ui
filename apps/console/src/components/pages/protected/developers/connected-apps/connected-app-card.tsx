'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Link2, Trash2 } from 'lucide-react'
import type { GetApiTokensQuery } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Panel } from '@repo/ui/panel'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteApiToken } from '@/lib/graphql-hooks/tokens'
import type { AuthorMaps } from '@/lib/authors'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { connectedAppLifetime, type TConnectedApp } from './connected-apps'
import { ScopeSummary } from '@/components/shared/token-scopes/scope-summary'

type TConnectedAppToken = NonNullable<NonNullable<NonNullable<GetApiTokensQuery['apiTokens']['edges']>[number]>['node']>

type TConnectedAppCardProps = {
  app: TConnectedApp
  tokens: TConnectedAppToken[]
  authorMaps: AuthorMaps
  isLoading: boolean
  isError: boolean
  manageDisabledReason?: string
}

export const ConnectedAppCard = ({ app, tokens, authorMaps, isLoading, isError, manageDisabledReason }: TConnectedAppCardProps) => {
  const [revokeTarget, setRevokeTarget] = useState<TConnectedAppToken | null>(null)
  const { mutateAsync: deleteToken, isPending: isRevoking } = useDeleteApiToken()
  const { successNotification, errorNotification } = useNotification()
  const lifetime = connectedAppLifetime(app)
  const Icon = app.icon

  const handleRevoke = async () => {
    if (!revokeTarget) return
    try {
      await deleteToken({ deleteAPITokenId: revokeTarget.id })
      successNotification({ title: 'Connection revoked', description: `${app.name} can no longer use that connection.` })
    } catch (error) {
      errorNotification({ title: 'The connection could not be revoked', description: parseErrorMessage(error) })
    } finally {
      setRevokeTarget(null)
    }
  }

  const renderConnections = () => {
    if (isLoading) {
      return (
        <div role="status" aria-live="polite" aria-label={`Loading ${app.name} connections`}>
          <SkeletonRows count={2} height={16} />
        </div>
      )
    }
    if (isError) {
      return <p className="text-sm text-muted-foreground">Connections could not be loaded. Please try again later.</p>
    }
    if (tokens.length === 0) {
      return <p className="text-sm text-muted-foreground">Nobody in this organization has connected {app.name} yet.</p>
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Connected by</TableHead>
            <TableHead>Connected</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.id}>
              <TableCell className="max-w-64">
                <AuthorCell id={token.createdBy} {...authorMaps} emptyLabel="-" />
              </TableCell>
              <TableCell>
                <DateCell value={token.createdAt} />
              </TableCell>
              <TableCell>
                <DateCell value={token.expiresAt} empty="Never" />
              </TableCell>
              <TableCell>
                <DateCell value={token.lastUsedAt} variant="timesince" empty="Never" />
              </TableCell>
              <TableCell className="text-right">
                <DisabledReasonTooltip reason={manageDisabledReason}>
                  <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" disabled={!!manageDisabledReason} onClick={() => setRevokeTarget(token)}>
                    Revoke
                  </Button>
                </DisabledReasonTooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <Panel gap={6}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-secondary text-muted-foreground">
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{app.name}</h3>
              <SystemTooltip
                icon={
                  <Badge variant="outline" className="whitespace-nowrap">
                    {lifetime.label}
                  </Badge>
                }
                content={lifetime.detail}
              />
            </div>
            <p className="text-sm text-muted-foreground">{app.description}</p>
          </div>
        </div>
        {manageDisabledReason ? (
          <DisabledReasonTooltip reason={manageDisabledReason}>
            <Button variant="secondary" icon={<Link2 size={16} />} iconPosition="left" disabled>
              Connect
            </Button>
          </DisabledReasonTooltip>
        ) : (
          <Button asChild variant="secondary" icon={<Link2 size={16} />} iconPosition="left">
            <Link href={app.connectHref}>Connect</Link>
          </Button>
        )}
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">Access</h4>
        <ScopeSummary scopes={app.scopes} />
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">Active connections</h4>
        {renderConnections()}
      </section>

      <ConfirmationDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        onConfirm={handleRevoke}
        loading={isRevoking}
        title={`Revoke ${app.name} connection`}
        description={`The browser using this connection will be signed out of ${app.name} and will need to connect again.`}
        confirmationText="Revoke"
        confirmationTextVariant="destructive"
      />
    </Panel>
  )
}
