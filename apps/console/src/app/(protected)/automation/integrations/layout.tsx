import React from 'react'
import IntegrationsAccessGate from '@/components/pages/protected/integrations/integrations-access-gate'

const IntegrationsLayout = ({ children }: { children: React.ReactNode }) => <IntegrationsAccessGate>{children}</IntegrationsAccessGate>

export default IntegrationsLayout
