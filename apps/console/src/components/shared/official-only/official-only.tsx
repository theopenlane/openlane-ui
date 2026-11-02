'use client'

import React from 'react'
import { useOfficialDeploymentStatus } from '@repo/ui/lib/official-deployment'

type OfficialOnlyProps = {
  children: React.ReactNode
  // waits for the hostname check instead of assuming official, use for anything that calls Openlane services
  strict?: boolean
}

// renders children only on official Openlane domains
const OfficialOnly = ({ children, strict = false }: OfficialOnlyProps) => {
  const status = useOfficialDeploymentStatus()
  const isOfficial = strict ? status === true : status !== false

  return isOfficial ? <>{children}</> : null
}

export default OfficialOnly
