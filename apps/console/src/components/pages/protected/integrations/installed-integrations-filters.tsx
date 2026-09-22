import React from 'react'
import { type IntegrationHealthFilter } from '@/lib/integrations/types'
import { type TIntegrationHealthOption } from '@/lib/integrations/health'
import IntegrationFilterChips from './integration-filter-chips'

type InstalledIntegrationsFiltersProps = {
  healthFilter: IntegrationHealthFilter
  setHealthFilter: (health: IntegrationHealthFilter) => void
  healthOptions: TIntegrationHealthOption[]
}

const InstalledIntegrationsFilters = ({ healthFilter, setHealthFilter, healthOptions }: InstalledIntegrationsFiltersProps) => (
  <div className="flex flex-col gap-3">
    <p className="text-sm text-muted-foreground">One card per installed integration. Manage connections and monitor health.</p>
    {healthOptions.length > 1 && <IntegrationFilterChips label="Health" chips={healthOptions} isSelected={(value) => healthFilter === value} onSelect={setHealthFilter} />}
  </div>
)

export default InstalledIntegrationsFilters
