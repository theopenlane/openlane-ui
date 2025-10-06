'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ControlReportPage from '@/components/pages/protected/control-report/control-report-page'
import ControlsTable from '@/components/pages/protected/controls/table/controls-table'

export const ControlSwitcher: React.FC = () => {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as 'report' | 'controls') ?? 'report'

  const [active, setActive] = useState<'report' | 'controls'>(initialTab)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', active)
    window.history.replaceState({}, '', url.toString())
  }, [active])

  return active === 'report' ? <ControlReportPage active={active} setActive={setActive} /> : <ControlsTable active={active} setActive={setActive} />
}
