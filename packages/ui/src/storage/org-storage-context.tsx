'use client'

import { createContext, useContext, type ReactNode } from 'react'

const OrgStorageContext = createContext<string | undefined>(undefined)

type OrgStorageProviderProps = {
  organizationId?: string
  children: ReactNode
}

export const OrgStorageProvider = ({ organizationId, children }: OrgStorageProviderProps) => <OrgStorageContext.Provider value={organizationId}>{children}</OrgStorageContext.Provider>

export const useOrgStorageId = (): string | undefined => useContext(OrgStorageContext)
