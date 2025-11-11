'use client'

import React from 'react'
import ControlReportPage from '@/components/pages/protected/control-report/control-report-page'
import ControlsTable from '@/components/pages/protected/controls/table/controls-table'
import TabSwitcherWrapper from '@/components/shared/tab-switcher/tab-switcher-wrapper'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'

export const ControlSwitcher: React.FC = () => (
  <TabSwitcherWrapper storageKey={TabSwitcherStorageKeys.CONTROL}>
    {({ active, setActive }) => (active === 'dashboard' ? <ControlReportPage active={active} setActive={setActive} /> : <ControlsTable active={active} setActive={setActive} />)}
  </TabSwitcherWrapper>
)
