/* eslint-disable @eslint-react/no-missing-key -- guide steps are static config arrays of ReactNodes; keys are applied where they're rendered (StepList maps each with key={index}) */
import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'
import { type IntegrationProvider } from './types'
import { normalizeIntegrationToken } from './utils'

export type ProviderSetupGuide = {
  intro?: React.ReactNode
  /** Display name of the external system the first group of steps is performed in, e.g. "AWS", "Google Cloud" */
  systemName?: string
  /** Steps performed in the external system, before or after the Openlane steps */
  externalSteps?: React.ReactNode[]
  /** Steps performed here in Openlane, on the screen this guide is opened from */
  openlaneSteps: React.ReactNode[]
}

/** Marks a step as unnumbered, full-width supplementary content (e.g. a code block or callout) that follows
 * the preceding step flush with the left edge — rather than nested and indented under a number bubble. */
function GuideNote({ children }: { children: React.ReactNode }) {
  return <div className="pt-2">{children}</div>
}

/** An external link styled consistently inside guide steps — opens in a new tab */
function GuideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
      {children}
    </a>
  )
}

function StepList({ steps }: { steps: React.ReactNode[] }) {
  const rows: { step: React.ReactNode; number: number | null }[] = []
  let count = 0
  for (const step of steps) {
    const isNote = React.isValidElement(step) && step.type === GuideNote
    count = isNote ? count : count + 1
    rows.push({ step, number: isNote ? null : count })
  }

  return (
    <ol className="flex flex-col gap-2">
      {rows.map(({ step, number }, i) =>
        number === null ? (
          <li key={i}>{step}</li>
        ) : (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">{number}</span>
            <span>{step}</span>
          </li>
        ),
      )}
    </ol>
  )
}

/** Renders a guide's steps as two labeled groups — "In {systemName}" and "In Openlane" — skipping any empty group */
export function GuideStepGroups({ guide }: { guide: ProviderSetupGuide }) {
  return (
    <>
      {guide.externalSteps?.length ? (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">In {guide.systemName ?? 'the external system'}</h4>
          <StepList steps={guide.externalSteps} />
        </div>
      ) : null}
      {guide.openlaneSteps.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">In Openlane</h4>
          <StepList steps={guide.openlaneSteps} />
        </div>
      ) : null}
    </>
  )
}

/** Live values pulled from the credential form / connection metadata — available by the time the guide opens */
export type GuideLiveValues = {
  principalArn?: string
  externalId?: string
  /** Deduped permissions/scopes aggregated from the provider's operations (`requiredPermissions`) */
  requiredPermissions?: string[]
}

/** Renders a list of permission/scope strings as a copyable code block, one per line */
function ScopeList({ scopes }: { scopes: string[] }) {
  return <CodeBlock code={scopes.join('\n')} />
}

/** A guide can be static content, or a function of the live form/connection values (e.g. to inline a real ARN into a code block instead of a placeholder) */
type MaybeDynamicGuide = ProviderSetupGuide | ((live: GuideLiveValues) => ProviderSetupGuide)

type ProviderSetupGuideConfig =
  | MaybeDynamicGuide
  | {
      default: MaybeDynamicGuide
      variants: { match: string[]; guide: MaybeDynamicGuide }[]
    }

function resolveGuide(guide: MaybeDynamicGuide, live: GuideLiveValues): ProviderSetupGuide {
  return typeof guide === 'function' ? guide(live) : guide
}

/** Inline, copyable command/script block for setup steps that involve running something in a terminal */
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative mt-2 rounded-md bg-muted px-3 py-2 pr-9 font-mono text-xs text-foreground whitespace-pre-wrap break-all">
      {code}
      <button type="button" onClick={handleCopy} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy to clipboard">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

type FieldTableRow = { field: string; required: string; description: React.ReactNode }

/** Inline reference table for setup steps that list several form-field options at once */
function FieldTable({ rows }: { rows: FieldTableRow[] }) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-1.5 text-left font-medium">Field</th>
            <th className="px-3 py-1.5 text-left font-medium">Required</th>
            <th className="px-3 py-1.5 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field} className="border-b last:border-0">
              <td className="px-3 py-1.5 align-top font-mono">{row.field}</td>
              <td className="px-3 py-1.5 align-top text-muted-foreground">{row.required}</td>
              <td className="px-3 py-1.5 align-top text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Shared explanation embedded wherever a guide step references a "Filter Expression" sync setting */
const CEL_FILTER_GUIDE: React.ReactNode = (
  <Callout variant="suggestion" title="Filtering with CEL" compact>
    <p>
      Sync settings with a <span className="font-medium">Filter Expression</span> field accept CEL (Common Expression Language). Each expression is evaluated against the record&apos;s raw payload via{' '}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">payload.&lt;field&gt;</code> — only records where it evaluates to{' '}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">true</code> are ingested. Leave it blank to ingest everything.
    </p>
    <CodeBlock code={`payload.status == 'ACTIVE'`} />
    <p className="mt-2 text-xs text-muted-foreground">
      Combine multiple conditions with <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">&amp;&amp;</code>.
    </p>
  </Callout>
)

/** A step that references a Filter Expression setting, paired with the shared CEL explanation as its own
 * flush-left note — spread this into a steps array, e.g. `...filterExpressionStep('..')` */
function filterExpressionStep(context: React.ReactNode): React.ReactNode[] {
  return [context, <GuideNote>{CEL_FILTER_GUIDE}</GuideNote>]
}

const gcpGuide: ProviderSetupGuide = {
  intro:
    'If your team runs infrastructure on Google Cloud, this integration brings Security Command Center findings into Openlane automatically. You get a single place to track cloud security findings, remediation timelines, and SLA compliance.',
  systemName: 'Google Cloud',
  externalSteps: [
    'Enable the Security Command Center API in the target GCP project and confirm you have permission to create service accounts and IAM bindings',
    <>Download and run the Openlane GCP setup script — it configures IAM, enables required APIs, and prints the service account key JSON to paste into Openlane</>,
    <GuideNote>
      <CodeBlock
        code={`curl -fsSL https://docs.theopenlane.io/integrations/setup/gcp/openlane-gcp-scc-setup.sh \
  -o openlane-gcp-scc-setup.sh
chmod +x openlane-gcp-scc-setup.sh
./openlane-gcp-scc-setup.sh \
  --project-id <PROJECT_ID> \
  --organization-id <ORGANIZATION_ID>`}
      />
    </GuideNote>,
    <GuideNote>
      <p className="font-medium text-foreground">Finding your SCC source IDs (optional)</p>
      <GuideNote>
        <p className="font-medium text-foreground">Option A: GCP Console</p>
        <div className="mt-1 flex flex-col gap-2 text-sm text-muted-foreground">
          <p>1. Go to Security Command Center &gt; Settings &gt; Sources.</p>
          <p>2. Each row shows a source — the numeric ID at the end of the resource name is what you need.</p>
        </div>
      </GuideNote>
      <GuideNote>
        <p className="font-medium text-foreground">Option B: REST API</p>
        <div className="mt-1 flex flex-col gap-2 text-sm text-muted-foreground">
          <p>1. List the sources for your organization:</p>
          <CodeBlock
            code={`curl -s \\
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\
  -H "x-goog-user-project: <PROJECT_ID>" \\
  "https://securitycenter.googleapis.com/v2/organizations/<ORG_ID>/sources?pageSize=100"`}
          />
          <p>
            2. This returns source resource names like <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">organizations/123/sources/456</code> — paste the full name or just the
            numeric suffix into <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">sccSourceIds</code>.
          </p>
        </div>
      </GuideNote>
    </GuideNote>,
  ],
  openlaneSteps: [
    'Paste the service account key JSON and fill in the remaining fields as needed:',
    <GuideNote>
      <FieldTable
        rows={[
          { field: 'organizationId', required: 'Yes (one of organizationId or projectId)', description: 'ID of the organization to use as the parent' },
          { field: 'projectId', required: 'Yes (one of organizationId or projectId)', description: 'ID of the project to use as the parent' },
          { field: 'projectScope', required: 'No', description: 'Filter project scope; only applies when using an Organization ID as the parent (all or specific)' },
          { field: 'projectIds', required: 'Conditional', description: 'List of project IDs to include; required when projectScope is specific' },
          { field: 'sccSourceIds', required: 'No', description: 'List of SCC source IDs to limit which sources findings are pulled from' },
          { field: 'oauthScopes', required: 'No', description: 'OAuth scopes to request for the service account; defaults to https://www.googleapis.com/auth/cloud-platform' },
        ]}
      />
    </GuideNote>,
    ...filterExpressionStep('Optionally add a Filter Expression to scope which findings are ingested'),
    'Click Save & Connect',
  ],
}

// Keyed by normalizeIntegrationToken(provider.slug | provider.family | provider.displayName) — add an entry to enable the "Setup guide" slide-out for that integration
const PROVIDER_SETUP_GUIDES: Record<string, ProviderSetupGuideConfig> = {
  authentik: {
    intro: 'Authentik connects with a static API token scoped to a dedicated service account.',
    systemName: 'Authentik',
    externalSteps: [
      'Go to Directory > Users and create (or select) a dedicated service account for Openlane',
      'Go to Directory > Tokens and App passwords, click Create, and choose API Token as the type',
      'Assign the token to the Openlane service account and copy the token value — it is only shown once',
    ],
    openlaneSteps: [
      "Enter your instance's Base URL",
      'Enter the API token you just copied',
      ...filterExpressionStep('Optionally add a Filter Expression to scope which directory records sync'),
      'Click Save',
    ],
  },
  aws: {
    default: (live: GuideLiveValues): ProviderSetupGuide => {
      const principalArn = live.principalArn || '<OPENLANE_PRINCIPAL_ARN>'
      const externalId = live.externalId || '<OPENLANE_EXTERNAL_ID>'

      return {
        intro: 'Openlane reads Security Hub findings, IAM, and AWS Config data through a read-only cross-account IAM role. The commands below already include your Principal ARN and External ID.',
        systemName: 'AWS',
        externalSteps: [
          'Choose one of the following methods to create the cross-account IAM role that trusts Openlane',
          <GuideNote>
            <p className="font-medium text-foreground">Option A: CloudFormation</p>
            <div className="mt-1 flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                1. Run <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">aws sts get-caller-identity</code> to confirm you are targeting the correct account before proceeding.
              </p>
              <p>2. Download the Openlane CloudFormation template:</p>
              <CodeBlock
                code={`curl -fsSL https://docs.theopenlane.io/integrations/setup/aws/openlane-aws-integration-role.yaml \\
  -o openlane-aws-integration-role.yaml`}
              />
              <p>
                3. Deploy the template to create the cross-account role, trust policy, and a read-only inline policy scoped to Security Hub (IAM and Config access are opt-in). This already contains
                your Principal ARN and a unique External ID — just fill in the home region.
              </p>
              <CodeBlock
                code={`aws cloudformation deploy \\
  --stack-name openlane-aws-integration \\
  --template-file openlane-aws-integration-role.yaml \\
  --capabilities CAPABILITY_NAMED_IAM \\
  --parameter-overrides \\
    OpenlanePrincipalArn=${principalArn} \\
    ExternalId=${externalId} \\
    HomeRegion=<SECURITY_HUB_HOME_REGION>`}
              />
              <p>4. Capture the deployed role&apos;s ARN from the stack outputs:</p>
              <CodeBlock
                code={`aws cloudformation describe-stacks \\
  --stack-name openlane-aws-integration \\
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \\
  --output table`}
              />
            </div>
          </GuideNote>,
          <GuideNote>
            <p className="font-medium text-foreground">Option B: AWS Console (manual)</p>
            <div className="mt-1 flex flex-col gap-2 text-sm text-muted-foreground">
              <p>1. In the AWS Console, go to IAM &gt; Roles &gt; Create role.</p>
              <p>2. Under Trusted entity type, select Custom trust policy.</p>
              <p>3. Paste the trust policy below:</p>
              <CodeBlock
                code={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "${principalArn}"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "${externalId}"
        }
      }
    }
  ]
}`}
              />
              <p>4. Click Next, then click Next again to skip attaching managed policies — you&apos;ll add an inline policy instead.</p>
              <p>5. Name the role (e.g. OpenlaneIntegrationReadOnlyRole) and click Create role.</p>
              <p>6. Open the role, go to the Permissions tab, and click Add permissions &gt; Create inline policy.</p>
              <p>7. Switch to the JSON editor and paste the policy below, removing any blocks for data sources you don&apos;t want to grant:</p>
              <CodeBlock
                code={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "HealthCheckIdentity",
      "Effect": "Allow",
      "Action": ["securityhub:Describe*"],
      "Resource": "*"
    },
    {
      "Sid": "SecurityHubReadFindings",
      "Effect": "Allow",
      "Action": ["securityhub:GetFindings", "securityhub:Get*", "securityhub:List*", "securityhub:BatchGet*", "securityhub:Describe*"],
      "Resource": "*"
    },
    {
      "Sid": "IAMReadUsers",
      "Effect": "Allow",
      "Action": ["iam:ListUsers", "iam:ListGroups", "iam:ListGroupsForUser", "iam:ListUserTags"],
      "Resource": "*"
    },
    {
      "Sid": "AuditConfigReadRules",
      "Effect": "Allow",
      "Action": ["config:DescribeConfigRules", "config:DescribeComplianceByConfigRule", "controlcatalog:ListControls", "controlcatalog:ListControlMappings", "controlcatalog:ListCommonControls"],
      "Resource": "*"
    }
  ]
}`}
              />
              <p>8. Click Next, name the policy, and click Save.</p>
              <p>9. Copy the Role ARN shown at the top of the role summary page.</p>
            </div>
          </GuideNote>,
          'Enable Security Hub in the accounts and regions you want monitored',
        ],
        openlaneSteps: [
          'Enter the Role ARN and home region',
          ...filterExpressionStep('Optionally add a Filter Expression to scope which Security Hub findings or IAM directory records are ingested'),
          'Click Save & Connect',
        ],
      }
    },
    variants: [
      {
        match: ['static', 'accesskey', 'iamuser'],
        guide: {
          intro: 'Static credentials use a long-lived IAM user access key instead of role assumption. Use this only when cross-account role assumption is not available — rotate the key regularly.',
          systemName: 'AWS',
          externalSteps: [
            'Go to IAM > Users > Create user and add a dedicated read-only user (e.g. openlane-integration-readonly)',
            'Attach an inline policy scoped to Security Hub (and optionally IAM and AWS Config) — do not use a broad managed policy',
            "Open the user's Security credentials tab, click Create access key, and choose Third-party service as the use case",
            'Copy the Access Key ID and Secret Access Key — the secret is only shown once',
          ],
          openlaneSteps: ['Enter the Access Key ID and Secret Access Key', 'Click Save'],
        },
      },
    ],
  },
  azureentraid: {
    intro: 'Azure Entra ID connects via OAuth through Microsoft Graph — no manual credentials required.',
    systemName: 'Microsoft',
    openlaneSteps: [
      'Click Continue to Authorization to start the redirect to Microsoft',
      "After authorization, you'll be redirected back to Openlane with the connection saved",
      'Optionally mark this connection as your Primary Directory',
      ...filterExpressionStep('Optionally add a Filter Expression to scope which directory records sync'),
    ],
  },
  microsoftdefenderforcloud: {
    intro: 'Openlane reads Defender for Cloud alerts and recommendations using a service principal with Security Reader access.',
    systemName: 'Azure',
    externalSteps: [
      'Create or select an app registration and generate a client secret',
      "Assign the Security Reader role to the service principal at the target subscription's Access control (IAM) blade",
      'Record the Tenant ID, Client ID, Client Secret, and Subscription ID',
    ],
    openlaneSteps: ['Enter the tenant, client, and subscription values', 'Click Save'],
  },
  buildkite: {
    intro: 'Buildkite connects using an organization-scoped API token.',
    systemName: 'Buildkite',
    externalSteps: ['Go to your organization settings and generate an API token with read access to organization, pipeline, and team metadata'],
    openlaneSteps: ['Enter the API token and your Buildkite organization slug — team or pipeline slugs are optional to narrow scope', 'Click Save'],
  },
  cloudflare: {
    intro: 'Connect Cloudflare using an Account API Token scoped to the resources you want Openlane to access.',
    systemName: 'Cloudflare',
    externalSteps: [
      'Go to Manage Account > API tokens',
      'Click Create Token and build a custom token with read scopes for the resources you want Openlane to see',
      'Ensure you create an Account API Token, not a User API Token — user tokens break if that person is removed',
    ],
    openlaneSteps: ['Enter the API token and your Cloudflare Account ID', ...filterExpressionStep('Optionally add a Filter Expression to scope which records are ingested'), 'Click Save & Connect'],
  },
  googlecloud: gcpGuide,
  gcpsecuritycommandcenter: gcpGuide,
  githubapp: {
    intro: 'The GitHub App integration uses installation-scoped, short-lived tokens instead of user OAuth credentials.',
    systemName: 'GitHub',
    externalSteps: [
      'Choose the organization to install the app in',
      'Select repository access — all repositories or only selected ones',
      'Complete the installation — GitHub redirects back to Openlane automatically',
    ],
    openlaneSteps: [
      'Click Continue to Authorization to start the redirect to GitHub',
      'Once redirected back, optionally configure which data sources sync (security alerts, directory accounts, repositories)',
      ...filterExpressionStep('Optionally add a Filter Expression to scope any of those data sources'),
    ],
  },
  googledrive: {
    intro: 'Google Drive syncs policy documents from a specific folder into Openlane — documents stay editable in Drive and read-only in Openlane.',
    systemName: 'Google',
    openlaneSteps: [
      'Click Continue to Authorization to start the redirect to Google',
      "Copy the target folder's ID from its Drive URL and enter it in the Folder ID field — leave blank to sync from the root of My Drive",
      'Optionally mark Google Drive as your Primary Document Manager so new policies default to Drive-managed documents',
    ],
  },
  googleworkspace: {
    intro: 'Google Workspace syncs directory users and group memberships into Openlane via OAuth.',
    systemName: 'Google',
    externalSteps: ['Confirm the Admin SDK API is enabled in your Google Cloud project', 'Sign in with a Workspace super admin account and grant the requested directory permissions'],
    openlaneSteps: [
      'Click Continue to Authorization to start the redirect to Google',
      "After authorization, you'll be redirected back to Openlane with the connection saved",
      'Optionally mark this connection as your Primary Directory',
      ...filterExpressionStep('Optionally add a Filter Expression to scope which records sync'),
    ],
  },
  microsoftonedrive: {
    intro: 'OneDrive syncs policy documents from a specific folder into Openlane — documents stay editable in OneDrive and read-only in Openlane.',
    systemName: 'Microsoft',
    openlaneSteps: [
      'Click Continue to Authorization to start the redirect to Microsoft',
      'Enter the folder name to sync (e.g. Policies) — leave blank to sync from the root of your OneDrive',
      'Optionally mark OneDrive as your Primary Document Manager so new policies default to OneDrive-managed documents',
    ],
  },
  microsoftteams: {
    intro: 'Microsoft Teams delivers compliance and security notifications directly into your channels.',
    systemName: 'Microsoft',
    externalSteps: [
      'In your Entra app registration, configure the Openlane callback URL and grant Graph permissions for profile/team read and channel message send, with admin consent',
      'Sign in to Microsoft and grant the requested permissions',
    ],
    openlaneSteps: ['Click Connect to start the redirect to Microsoft', 'Enter your Azure AD Tenant ID to complete the connection'],
  },
  okta: {
    intro: 'Okta connects with an API token and syncs directory, application assignments, and authentication policy data.',
    systemName: 'Okta',
    externalSteps: ['Go to Security > API > Tokens and generate a new API token with org and policy read access'],
    openlaneSteps: ['Enter your Okta org URL (e.g. https://acme.okta.com) and the API token', 'Click Save'],
  },
  slack: {
    default: {
      intro: 'Connect your Slack workspace via OAuth — no credentials to enter manually.',
      systemName: 'Slack',
      externalSteps: ['Review and approve the requested permissions', 'Invite the Openlane bot user to any channel you want it to post in'],
      openlaneSteps: ['Expand Slack OAuth Credential and click Continue to Authorization to start the redirect to Slack', "After authorization, you'll be redirected back with the connection saved"],
    },
    variants: [
      {
        match: ['bot', 'bottoken'],
        guide: (live: GuideLiveValues): ProviderSetupGuide => ({
          intro: 'Use a bot token from a custom Slack app when your workspace requires a dedicated app with explicit scope control.',
          systemName: 'Slack',
          externalSteps: [
            <>
              Go to <GuideLink href="https://api.slack.com/apps">api.slack.com/apps</GuideLink> and create or select an app
            </>,
            live.requiredPermissions?.length ? (
              <>
                Under OAuth & Permissions, add the required bot token scopes:
                <ScopeList scopes={live.requiredPermissions} />
              </>
            ) : (
              'Under OAuth & Permissions, add the required bot token scopes (channels:read, chat:write, chat:write.public, and any others needed)'
            ),
            'Install the app to your workspace',
            'Copy the Bot User OAuth Token from the OAuth & Permissions page',
            'Invite the Openlane bot user to any channel you want it to post in',
          ],
          openlaneSteps: ['Expand Slack Bot Token and paste the token', 'Click Save'],
        }),
      },
    ],
  },
  vercel: {
    intro: 'Vercel brings project and deployment history into Openlane using a read-only API token.',
    systemName: 'Vercel',
    externalSteps: ['Go to your account settings and generate a personal or team API token with read access to projects'],
    openlaneSteps: ['Enter the API token — team ID, project ID, and environment are optional to narrow scope', 'Click Save'],
  },
  tailscale: (live: GuideLiveValues): ProviderSetupGuide => ({
    intro: 'Tailscale connects with a scoped OAuth credential to sync tailnet users and enrolled devices.',
    systemName: 'Tailscale',
    externalSteps: [
      'Go to Settings > Trust credentials and click Create trust credential, selecting OAuth as the type',
      live.requiredPermissions?.length ? (
        <>
          Select Custom scopes and enable the scopes you need:
          <ScopeList scopes={live.requiredPermissions} />
        </>
      ) : (
        'Select Custom scopes and enable users:read (required), plus policy_file:read, devices:core:read, devices:posture_attributes:read, and devices:routes:read as needed'
      ),
      'Click Create credential and copy the Client ID and Client secret — the secret is only shown once',
    ],
    openlaneSteps: ['Enter the Client ID and Client secret', 'Click Save'],
  }),
}

type VariantConfig = { default: MaybeDynamicGuide; variants: { match: string[]; guide: MaybeDynamicGuide }[] }

const isVariantConfig = (config: ProviderSetupGuideConfig): config is VariantConfig => typeof config === 'object' && config !== null && 'default' in config

/** `connectionLabel` is typically the credential entry's name (e.g. "Slack Bot Token") — used to pick a connection-specific variant.
 * `live` supplies real values (e.g. the connection's Principal ARN, the generated External ID) for guides that inline them into code blocks. */
export const getProviderSetupGuide = (provider?: Pick<IntegrationProvider, 'slug' | 'family' | 'displayName'>, connectionLabel?: string, live: GuideLiveValues = {}): ProviderSetupGuide | null => {
  let config: ProviderSetupGuideConfig | undefined
  for (const candidate of [provider?.slug, provider?.family, provider?.displayName]) {
    const token = normalizeIntegrationToken(candidate)
    if (token && PROVIDER_SETUP_GUIDES[token]) {
      config = PROVIDER_SETUP_GUIDES[token]
      break
    }
  }

  if (!config) {
    return null
  }

  if (!isVariantConfig(config)) {
    return resolveGuide(config, live)
  }

  const normalizedLabel = normalizeIntegrationToken(connectionLabel)
  const variant = normalizedLabel ? config.variants.find(({ match }) => match.some((keyword) => normalizedLabel.includes(keyword))) : undefined

  return resolveGuide(variant?.guide ?? config.default, live)
}
