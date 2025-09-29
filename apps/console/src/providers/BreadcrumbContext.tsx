'use client'
import React from 'react'

export type Crumb = { label?: string; href?: string; isLoading?: boolean }

export const BreadcrumbContext = React.createContext<{
  crumbs: Crumb[]
  setCrumbs: React.Dispatch<React.SetStateAction<Crumb[]>>
}>({ crumbs: [], setCrumbs: () => {} })

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbs] = React.useState<Crumb[]>([])
  console.log(crumbs)
  return <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>{children}</BreadcrumbContext.Provider>
}
