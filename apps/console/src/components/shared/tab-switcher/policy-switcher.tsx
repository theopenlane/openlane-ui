'use client'

import React from 'react'
import TabSwitcherWrapper from '@/components/shared/tab-switcher/tab-switcher-wrapper'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'
import PoliciesPage from '@/components/pages/protected/policies/policies-page.tsx'

export const PolicySwitcher: React.FC = () => (
  <TabSwitcherWrapper storageKey={TabSwitcherStorageKeys.POLICY}>{({ active, setActive }) => <PoliciesPage active={active} setActive={setActive} />}</TabSwitcherWrapper>
)
