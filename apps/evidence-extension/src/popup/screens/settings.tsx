import { useMutation } from '@tanstack/react-query'
import { ExternalLink, LogOut } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DELETE_PERSONAL_ACCESS_TOKEN } from '@repo/codegen/query/tokens'
import type { DeletePersonalAccessTokenMutation, DeletePersonalAccessTokenMutationVariables } from '@repo/codegen/src/schema'
import { graphqlRequest } from '../../lib/api'
import { CAPTURE_SOURCE_LABEL } from '../../lib/capture'
import { PERSONAL_ACCESS_TOKENS_URL } from '../../lib/config'
import { clearConnection, type TConnection } from '../../lib/connection'
import { ErrorAlert, errorMessage } from '../components/error-alert'
import { ScreenTitle } from '../components/popup-header'

type TSettingsProps = {
  connection: TConnection
  collectorEmail?: string
}

const formatExpiry = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

export const Settings = ({ connection, collectorEmail }: TSettingsProps) => {
  const revoke = useMutation({
    mutationFn: () =>
      graphqlRequest<DeletePersonalAccessTokenMutation, DeletePersonalAccessTokenMutationVariables>(connection, DELETE_PERSONAL_ACCESS_TOKEN, {
        deletePersonalAccessTokenId: connection.tokenId,
      }),
    onSuccess: () => clearConnection(),
  })

  const rows: [string, string][] = [
    ['Organization', connection.organizationName],
    ['Signed in as', collectorEmail ?? '—'],
    ['Access token expires', formatExpiry(connection.expiresAt)],
    ['Capture source', CAPTURE_SOURCE_LABEL],
  ]

  return (
    <div className="space-y-4 p-4">
      <ScreenTitle title="Settings" />
      <dl className="space-y-3 rounded-lg border p-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <Button variant="secondary" full icon={<ExternalLink size={14} />} onClick={() => chrome.tabs.create({ url: PERSONAL_ACCESS_TOKENS_URL })}>
        Manage access tokens
      </Button>
      <Button variant="secondary" full icon={<LogOut size={14} />} loading={revoke.isPending} disabled={revoke.isPending} onClick={() => revoke.mutate()}>
        Disconnect and revoke token
      </Button>
      {revoke.isError && (
        <ErrorAlert>
          <p>The access token could not be revoked: {errorMessage(revoke.error, 'unknown error')}</p>
          <p>Revoke it from Manage access tokens, or disconnect this browser without revoking it.</p>
          <Button variant="link" className="text-blue-500" onClick={() => clearConnection()}>
            Disconnect without revoking
          </Button>
        </ErrorAlert>
      )}
    </div>
  )
}
