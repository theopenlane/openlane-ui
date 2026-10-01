'use client'

import React, { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Camera, CircleCheck, KeyRound, Link2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { EVIDENCE_EXTENSION_TOKEN_NAME, EVIDENCE_EXTENSION_TOKEN_TTL_MS, PERSONAL_ACCESS_TOKENS_PATH } from '@repo/evidence-capture/connect'
import { Callout } from '@/components/shared/callout/callout'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetAllOrganizations } from '@/lib/graphql-hooks/organization'
import { useCreatePersonalAccessToken, useDeletePersonalAccessToken } from '@/lib/graphql-hooks/tokens'
import { isEvidenceExtensionReachable, sendConnectionToEvidenceExtension } from '@/lib/evidence-extension'
import { MS_PER_DAY } from '@/utils/date'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'

const TOKEN_TTL_DAYS = Math.round(EVIDENCE_EXTENSION_TOKEN_TTL_MS / MS_PER_DAY)

const PANEL_CLASS = 'mx-auto mt-10 max-w-xl'

const subscribeToNothing = () => () => {}

type TTargetOrganization = { id: string; name: string }

const ExtensionConnectPage: React.FC = () => {
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const { isPending: organizationsPending } = useGetAllOrganizations()
  const organization = getOrganizationByID(currentOrgId)?.node
  const { mutateAsync: createToken } = useCreatePersonalAccessToken()
  const { mutateAsync: deleteToken } = useDeletePersonalAccessToken()
  const extensionReachable = useSyncExternalStore(subscribeToNothing, isEvidenceExtensionReachable, () => false)

  const connect = useMutation({
    mutationFn: async (target: TTargetOrganization) => {
      const tokenExpiry = new Date(Date.now() + EVIDENCE_EXTENSION_TOKEN_TTL_MS).toISOString()
      const { personalAccessToken } = (
        await createToken({
          input: {
            name: EVIDENCE_EXTENSION_TOKEN_NAME,
            description: 'Created for the Openlane Evidence Capture browser extension to upload evidence.',
            expiresAt: tokenExpiry,
            organizationIDs: [target.id],
          },
        })
      ).createPersonalAccessToken

      try {
        return await sendConnectionToEvidenceExtension({
          type: 'openlane-evidence-capture/connect',
          token: personalAccessToken.token,
          tokenId: personalAccessToken.id,
          expiresAt: tokenExpiry,
          organizationId: target.id,
          organizationName: target.name,
        })
      } catch (error) {
        await deleteToken({ deletePersonalAccessTokenId: personalAccessToken.id }).catch(() => {
          throw new UserFacingError(`${parseErrorMessage(error)} The unused access token could not be revoked; delete "${EVIDENCE_EXTENSION_TOKEN_NAME}" from Personal Access Tokens.`)
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
          <span>
            Access uses a personal access token scoped to {organizationName} that expires after {TOKEN_TTL_DAYS} days. You can revoke it at any time from{' '}
            <Link href={PERSONAL_ACCESS_TOKENS_PATH} className="text-blue-500 hover:underline">
              Personal Access Tokens
            </Link>
            .
          </span>
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

      <Button
        icon={<Link2 size={16} />}
        iconPosition="left"
        loading={connect.isPending}
        disabled={ssoEnforced || !extensionReachable || connect.isPending}
        onClick={() => connect.mutate({ id: organization.id, name: organizationName })}
      >
        Connect extension
      </Button>
    </Panel>
  )
}

export default ExtensionConnectPage
