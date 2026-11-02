import * as React from 'react'

export const OFFICIAL_DOMAIN = 'theopenlane.io'

// preview deployments of the openlane-ui project from the openlane Vercel team
const VERCEL_PREVIEW_PREFIX = 'openlane-ui-'
const VERCEL_PREVIEW_SUFFIX = '-openlane.vercel.app'

const LOCAL_HOSTS = ['localhost', '127.0.0.1']

export const isOfficialHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase()

  if (host === OFFICIAL_DOMAIN || host.endsWith(`.${OFFICIAL_DOMAIN}`)) {
    return true
  }

  if (host.startsWith(VERCEL_PREVIEW_PREFIX) && host.endsWith(VERCEL_PREVIEW_SUFFIX)) {
    return true
  }

  return process.env.NODE_ENV === 'development' && LOCAL_HOSTS.includes(host)
}

// undefined until the hostname has been checked on the client
export const useOfficialDeploymentStatus = (): boolean | undefined => {
  const [isOfficial, setIsOfficial] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    setIsOfficial(isOfficialHost(window.location.hostname))
  }, [])

  return isOfficial
}

// assumes official until mounted so the hosted product never flashes the fork state
export const useIsOfficialDeployment = (): boolean => useOfficialDeploymentStatus() ?? true
