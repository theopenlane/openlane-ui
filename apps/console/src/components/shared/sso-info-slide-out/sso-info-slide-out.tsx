'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check } from 'lucide-react'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import { Callout } from '@/components/shared/callout/callout'
import { SSO_PROVIDER_LOGOS, SSO_PROVIDER_NAMES } from '@/components/shared/enum-mapper/sso-provider-enum'
import { type OrganizationSettingSsoProvider } from '@repo/codegen/src/schema'
import { siteUrl } from '@repo/dally/auth'

const REDIRECT_URI = `${siteUrl}/login/sso`

const SETUP_STEPS = [
  'In your identity provider, create an OAuth / OIDC client application (Web Application type).',
  null,
  'Copy the Client ID, Client Secret, and OIDC Discovery Endpoint from your IdP.',
  'Select the Identity Provider, enter the credentials, and save the configuration.',
  'Click Re-test Connection to verify authentication works end-to-end.',
  'Once verified, click Enforce SSO — this requires all members to authenticate via SSO.',
]

const PREREQUISITES = [
  { label: 'Client ID', detail: 'The public identifier for your application, obtained from your IdP.' },
  { label: 'Client Secret', detail: 'A confidential secret used to authenticate your application with the IdP.' },
  {
    label: 'OIDC Discovery Endpoint',
    detail: "The URL where Openlane retrieves your IdP's configuration, typically ending with /.well-known/openid-configuration.",
  },
]

const PROVIDERS = (Object.keys(SSO_PROVIDER_LOGOS) as OrganizationSettingSsoProvider[]).flatMap((provider) => {
  const logo = SSO_PROVIDER_LOGOS[provider]
  return logo ? [{ name: SSO_PROVIDER_NAMES[provider] ?? provider, logo }] : []
})

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is the difference between OIDC and SAML?',
    a: 'OIDC is an identity layer on OAuth 2.0 using JSON/JWTs. It is lighter than SAML (XML-based) and provides a standardized ID token that asserts user identity.',
  },
  {
    q: 'How does offboarding work?',
    a: 'Disabling or removing a user in your IdP immediately prevents them from authenticating via SSO across all connected applications unless the user is exempt from SSO.',
  },
  {
    q: 'What about external users who are not in our IdP?',
    a: 'External users without IdP accounts will be blocked if SSO is enforced. To grant them access, mark them as SSO exempt on the Members page, or add their email domain to the exempt domains list in SSO settings. Users with the Owner or Auditor role are automatically exempt regardless.',
  },
  {
    q: 'Can contractors authenticate via SSO?',
    a: 'Yes, as long as they have an account in your IdP. Adding contractors to your IdP is the recommended approach for centralized access control and easy offboarding.',
  },
]

const TROUBLESHOOTING = [
  { issue: 'Invalid discovery URL', fix: 'Verify the exact /.well-known/openid-configuration path and issuer domain. Okta custom domains must reference the correct authorization server.' },
  { issue: 'Invalid redirect URI / login loop', fix: 'Ensure the redirect URI matches exactly — scheme, host, and path must all be identical.' },
]

export const SSOInfoSlideOut = () => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(REDIRECT_URI)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <InfoSlideOut
      title="Single Sign-On (SSO)"
      docsUrl="https://docs.theopenlane.io/docs/platform/security/authentication/sso"
      trigger={(open) => (
        <Callout variant="info" compact>
          Need help configuring SSO?{' '}
          <button type="button" onClick={open} className="text-primary font-medium underline-offset-4 hover:underline transition-colors">
            View setup guide
          </button>
        </Callout>
      )}
    >
      <div className="flex flex-col gap-6 pt-1">
        <p className="text-sm text-muted-foreground">
          Openlane supports <strong>OIDC (OpenID Connect)</strong> for Single Sign-On. You will need the following values from your identity provider to get started.
        </p>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-text-header">Supported Providers</h4>
          <div className="flex flex-wrap gap-3">
            {PROVIDERS.map(({ name, logo }) => (
              <div key={name} className="flex flex-col items-center rounded-lg border border-border bg-muted/40 px-3 pt-3 pb-2 w-[80px] h-[76px]">
                <div className="flex flex-1 items-center justify-center">
                  <Image src={logo} width={28} height={28} alt={name} className="object-contain max-h-7 max-w-7" />
                </div>
                <span className="text-xs text-muted-foreground text-center leading-tight">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-text-header">Prerequisites</h4>
          <div className="flex flex-col gap-2">
            {PREREQUISITES.map(({ label, detail }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm text-muted-foreground">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-text-header">Setup Steps</h4>
          <ol className="flex flex-col gap-2">
            {SETUP_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">{i + 1}</span>
                {step === null ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    Add the redirect URI:
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                      {REDIRECT_URI}
                      <button type="button" onClick={handleCopy} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy redirect URI">
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </span>
                  </span>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
        </div>

        <Callout variant="warning" compact>
          Only enforce SSO after a successful test. Members without IdP access will be unable to log in once enforcement is enabled.
        </Callout>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-text-header">FAQ</h4>
          {FAQ.map(({ q, a }) => (
            <div key={q} className="flex flex-col gap-1">
              <span className="text-sm font-medium">{q}</span>
              <span className="text-sm text-muted-foreground">{a}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-text-header">Troubleshooting</h4>
          {TROUBLESHOOTING.map(({ issue, fix }) => (
            <div key={issue} className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{issue}</span>
              <span className="text-sm text-muted-foreground">{fix}</span>
            </div>
          ))}
        </div>
      </div>
    </InfoSlideOut>
  )
}
