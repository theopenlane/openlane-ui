'use client'

import React, { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import { Camera, CircleCheck, KeyRound, Link2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import {
  CONNECT_MESSAGE_TYPE,
  CONNECTED_APPS_PATH,
  EVIDENCE_EXTENSION_SCOPES,
  EVIDENCE_EXTENSION_TOKEN_NAME,
  EVIDENCE_EXTENSION_TOKEN_TTL_DAYS,
  EVIDENCE_EXTENSION_TOKEN_TTL_MS,
  type TConnectMessage,
} from '@repo/evidence-capture/connect'
import { Callout } from '@/components/shared/callout/callout'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { ScopeSummary } from '@/components/shared/token-scopes/scope-summary'
import { useApiTokenAccessReason } from '@/components/pages/protected/developers/hooks/use-api-token-access-reason'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetAllOrganizations } from '@/lib/graphql-hooks/organization'
import { useCreateAPIToken, useDeleteApiToken } from '@/lib/graphql-hooks/tokens'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { isEvidenceExtensionReachable, sendConnectionToEvidenceExtension } from '@/lib/evidence-extension'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'

const PANEL_CLASS = 'mx-auto mt-10 max-w-xl'

const subscribeToNothing = () => () => {}

const ExtensionConnectPage: React.FC = () => {
  const { data: session } = useSession()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const { isPending: organizationsPending } = useGetAllOrganizations()
  const organization = getOrganizationByID(currentOrgId)?.node
  const accessReason = useApiTokenAccessReason('Only organization owners and admins can connect the extension for now.')
  const { data: userData, isPending: userPending } = useGetCurrentUser(session?.user?.userId)
  const { mutateAsync: createToken } = useCreateAPIToken()
  const { mutateAsync: deleteToken } = useDeleteApiToken()
  const extensionReachable = useSyncExternalStore(subscribeToNothing, isEvidenceExtensionReachable, () => false)

  const connect = useMutation({
    mutationFn: async (collector: TConnectMessage['collector']) => {
      const tokenExpiry = new Date(Date.now() + EVIDENCE_EXTENSION_TOKEN_TTL_MS).toISOString()
      const { apiToken } = (
        await createToken({
          input: {
            name: EVIDENCE_EXTENSION_TOKEN_NAME,
            description: `Connected by ${collector.email} for the Openlane Evidence Capture browser extension.`,
            expiresAt: tokenExpiry,
            scopes: [...EVIDENCE_EXTENSION_SCOPES],
          },
        })
      ).createAPIToken

      try {
        if (!apiToken.owner) {
          throw new UserFacingError('The access token was created without an organization, so the extension was not connected.')
        }
        return await sendConnectionToEvidenceExtension({
          type: CONNECT_MESSAGE_TYPE,
          token: apiToken.token,
          tokenId: apiToken.id,
          expiresAt: tokenExpiry,
          organizationId: apiToken.owner.id,
          organizationName: apiToken.owner.displayName,
          collector,
        })
      } catch (error) {
        await deleteToken({ deleteAPITokenId: apiToken.id }).catch(() => {
          throw new UserFacingError(`${parseErrorMessage(error)} The unused access token could not be revoked; revoke it from Connected Apps.`)
        })
        throw error
      }
    },
  })

  if (!organization) {
    return organizationsPending ? (
      <Panel className={PANEL_CLASS}>
        <div role="status" aria-live="polite" aria-label="Loading organization">
          <SkeletonRows count={3} height={16} />
        </div>
      </Panel>
    ) : (
      <Panel className={PANEL_CLASS}>
        <p className="text-sm text-muted-foreground">Your current organization could not be loaded, so the extension cannot be connected.</p>
      </Panel>
    )
  }

  const organizationName = organization.displayName
  const ssoEnforced = !!organization.setting?.identityProviderLoginEnforced
  const user = userData?.user

  const disabledReason = () => {
    if (accessReason) return accessReason
    if (userPending) return 'Loading your profile…'
    if (!user) return 'Your profile could not be loaded.'
    if (ssoEnforced) return `${organizationName} requires SSO.`
    if (!extensionReachable) return 'The extension was not detected in this browser.'
    return undefined
  }
  const reason = disabledReason()

  if (connect.isSuccess) {
    return (
      <Panel className={PANEL_CLASS} align="center" textAlign="center">
        <CircleCheck className="text-success" size={40} />
        <PanelHeader heading="Extension connected" subheading={`Openlane Evidence Capture can now upload evidence to ${organizationName}.`} noBorder />
        <p className="text-sm text-muted-foreground">Click the Openlane icon in your browser toolbar to capture evidence. You can close this tab.</p>
        {connect.data && (
          <Callout variant="warning" compact className="text-left">
            {connect.data}
          </Callout>
        )}
      </Panel>
    )
  }

  return (
    <Panel className={PANEL_CLASS}>
      <PanelHeader heading="Connect Openlane Evidence Capture" subheading="Let the browser extension capture screenshots and upload them as evidence." noBorder />
      <ul className="space-y-3 text-sm">
        <li className="flex gap-3">
          <Camera size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          <span>Create evidence, upload screenshots and link controls in {organizationName}.</span>
        </li>
        <li className="flex gap-3">
          <KeyRound size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="space-y-2">
            <p>
              Access uses an API token for {organizationName} that expires after {EVIDENCE_EXTENSION_TOKEN_TTL_DAYS} days, with these scopes:
            </p>
            <ScopeSummary scopes={EVIDENCE_EXTENSION_SCOPES} />
            <p>
              You can revoke it at any time from{' '}
              <Link href={CONNECTED_APPS_PATH} className="text-blue-500 hover:underline">
                Connected Apps
              </Link>
              .
            </p>
          </div>
        </li>
      </ul>

      {ssoEnforced && (
        <Callout variant="warning" title="Not available for SSO-enforced organizations yet" compact>
          {organizationName} requires SSO, and the extension cannot authorize its access token through your identity provider yet.
        </Callout>
      )}
      {!extensionReachable && (
        <Callout variant="warning" title="Extension not detected" compact>
          Install Openlane Evidence Capture in this browser, then open this page from the extension&apos;s Connect button.
        </Callout>
      )}
      {connect.isError && (
        <Callout variant="danger" title="Connection failed" compact>
          {parseErrorMessage(connect.error)}
        </Callout>
      )}

      <DisabledReasonTooltip reason={reason}>
        <Button
          icon={<Link2 size={16} />}
          iconPosition="left"
          loading={connect.isPending}
          disabled={!!reason || connect.isPending}
          onClick={() => user && connect.mutate({ id: user.id, email: user.email, displayName: user.displayName, avatarRemoteURL: user.avatarRemoteURL ?? undefined })}
        >
          Connect extension
        </Button>
      </DisabledReasonTooltip>
    </Panel>
  )
}

export default ExtensionConnectPage
