import { OrganizationSettingSsoProvider } from '@repo/codegen/src/schema'

export const SSO_PROVIDER_LOGOS: Partial<Record<OrganizationSettingSsoProvider, string>> = {
  [OrganizationSettingSsoProvider.GOOGLE_WORKSPACE]: '/icons/brand/integrations/google_workspace.png',
  [OrganizationSettingSsoProvider.MICROSOFT_ENTRA_ID]: '/icons/brand/integrations/microsoft_azure.png',
  [OrganizationSettingSsoProvider.OKTA]: '/icons/brand/integrations/okta.png',
  [OrganizationSettingSsoProvider.GITHUB]: '/icons/brand/github.svg',
  [OrganizationSettingSsoProvider.SLACK]: '/icons/brand/integrations/slack.png',
  [OrganizationSettingSsoProvider.ONE_LOGIN]: '/icons/brand/integrations/onelogin.webp',
  [OrganizationSettingSsoProvider.GENERIC_OIDC]: '/icons/brand/integrations/oidc.webp',
}

export const SSO_PROVIDER_NAMES: Partial<Record<OrganizationSettingSsoProvider, string>> = {
  [OrganizationSettingSsoProvider.GOOGLE_WORKSPACE]: 'Google Workspace',
  [OrganizationSettingSsoProvider.MICROSOFT_ENTRA_ID]: 'Microsoft Entra ID',
  [OrganizationSettingSsoProvider.OKTA]: 'Okta',
  [OrganizationSettingSsoProvider.GITHUB]: 'GitHub',
  [OrganizationSettingSsoProvider.SLACK]: 'Slack',
  [OrganizationSettingSsoProvider.ONE_LOGIN]: 'OneLogin',
  [OrganizationSettingSsoProvider.GENERIC_OIDC]: 'Generic OIDC',
}
