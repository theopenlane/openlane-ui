'use client'

import { createContext, use } from 'react'

type DashboardContentOffset = {
  marginLeft: number
  marginRight: number
}

const DashboardContentOffsetContext = createContext<DashboardContentOffset>({ marginLeft: 0, marginRight: 0 })

export const DashboardContentOffsetProvider = DashboardContentOffsetContext.Provider

export const useDashboardContentOffset = () => use(DashboardContentOffsetContext)
