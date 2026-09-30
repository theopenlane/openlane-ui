const KNOWN_SOURCES: ReadonlyArray<readonly [hostSuffix: string, source: string]> = [
  ['github.com', 'GitHub'],
  ['gitlab.com', 'GitLab'],
  ['bitbucket.org', 'Bitbucket'],
  ['okta.com', 'Okta'],
  ['oktapreview.com', 'Okta'],
  ['okta-emea.com', 'Okta'],
  ['auth0.com', 'Auth0'],
  ['onelogin.com', 'OneLogin'],
  ['jumpcloud.com', 'JumpCloud'],
  ['aws.amazon.com', 'AWS'],
  ['awsapps.com', 'AWS'],
  ['portal.azure.com', 'Microsoft Azure'],
  ['entra.microsoft.com', 'Microsoft Entra ID'],
  ['intune.microsoft.com', 'Microsoft Intune'],
  ['admin.microsoft.com', 'Microsoft 365'],
  ['cloud.google.com', 'Google Cloud'],
  ['admin.google.com', 'Google Workspace'],
  ['atlassian.net', 'Atlassian'],
  ['slack.com', 'Slack'],
  ['vercel.com', 'Vercel'],
  ['cloudflare.com', 'Cloudflare'],
  ['datadoghq.com', 'Datadog'],
  ['datadoghq.eu', 'Datadog'],
  ['linear.app', 'Linear'],
  ['notion.so', 'Notion'],
  ['1password.com', '1Password'],
  ['jamfcloud.com', 'Jamf'],
  ['kandji.io', 'Kandji'],
  ['crowdstrike.com', 'CrowdStrike'],
  ['salesforce.com', 'Salesforce'],
  ['heroku.com', 'Heroku'],
  ['digitalocean.com', 'DigitalOcean'],
  ['snowflakecomputing.com', 'Snowflake'],
  ['theopenlane.io', 'Openlane'],
]

const MULTI_PART_PUBLIC_SUFFIXES = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.jp', 'co.in', 'co.za', 'com.br', 'com.mx', 'com.sg', 'com.cn'])

const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/

const matchesHost = (hostname: string, suffix: string) => hostname === suffix || hostname.endsWith(`.${suffix}`)

const organizationLabel = (hostname: string) => {
  const labels = hostname.split('.')
  if (labels.length < 2 || IPV4_PATTERN.test(hostname)) {
    return hostname
  }
  const suffixLength = MULTI_PART_PUBLIC_SUFFIXES.has(labels.slice(-2).join('.')) ? 2 : 1
  const label = labels[labels.length - suffixLength - 1] ?? hostname
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const deriveEvidenceSource = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  const known = KNOWN_SOURCES.find(([suffix]) => matchesHost(host, suffix))
  return known ? known[1] : organizationLabel(host)
}
