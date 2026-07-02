'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { type IntegrationProvider, type IntegrationConnectionEntry } from '@/lib/integrations/types'
import { type FormValues, type SchemaSection } from '@/lib/integrations/schema'
import { type GuideLiveValues } from '@/lib/integrations/setup-guide-content'
import { disabledOperationConfigKeys, resolveConnectionEntry, resolveSchemaRoot } from '@/lib/integrations/utils'
import { CREDENTIALS_PREFIX, IntegrationSchemaSections } from './schema-form'
import ConnectionMetaSection from './connection-meta-section'
import IntegrationSetupGuide from './integration-setup-guide'
import IntegrationSetupWizard from './integration-setup-wizard'

type CredentialConnectionSectionProps = {
  provider: IntegrationProvider
  installedCount: number
  isConnecting: boolean
  onAuthConnect: () => void
  onSubmit: (formValues: Record<string, unknown>) => void
  formMethods: UseFormReturn<FormValues>
  credentialSections: SchemaSection[]
  userInputSections: SchemaSection[]
  isSubmitting: boolean
  selectedCredentialIndex: number
  onSelectCredential: (index: number) => void
}

const CredentialConnectionSection = ({
  provider,
  installedCount,
  isConnecting,
  onAuthConnect,
  onSubmit,
  formMethods,
  credentialSections,
  userInputSections,
  isSubmitting,
  selectedCredentialIndex,
  onSelectCredential,
}: CredentialConnectionSectionProps) => {
  const credentialEntries = provider.credentialSchemas ?? []
  const hasUserInputFields = userInputSections.length > 0

  const disabledConfigKeys = useMemo(() => disabledOperationConfigKeys(provider), [provider])

  const [wizardOpen, setWizardOpen] = useState(false)
  const activeEntry = credentialEntries[selectedCredentialIndex]
  const activeConnection = activeEntry ? resolveConnectionEntry(provider, activeEntry.ref) : undefined
  const activeIsAuth = activeConnection?.auth != null

  // Deduped scopes/permissions across all operations, so guides can list the exact scopes to grant
  const requiredPermissions = useMemo(() => {
    const all = (provider.operations ?? []).flatMap((op) => op.requiredPermissions ?? [])
    return Array.from(new Set(all))
  }, [provider.operations])

  // Watched so guides can inline the live, already-generated value instead of a placeholder
  const externalId = formMethods.watch(`${CREDENTIALS_PREFIX}externalId`) as string | undefined
  const getLiveValues = (connection?: IntegrationConnectionEntry): GuideLiveValues => ({
    principalArn: connection?.meta?.['Openlane Principal ARN']?.Value,
    externalId,
    requiredPermissions,
  })

  const handleStartWizard = (index: number) => {
    onSelectCredential(index)
    setWizardOpen(true)
  }

  if (credentialEntries.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <h3 className="text-base uppercase tracking-widest">{installedCount > 0 ? 'Add New Connection' : 'Connect'}</h3>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">Choose one of the available authentication methods to setup the integration</p>

      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)}>
          <div className="space-y-3">
            {credentialEntries.map((entry, index) => {
              const isSelected = index === selectedCredentialIndex
              const connection = resolveConnectionEntry(provider, entry.ref)
              const isAuth = connection?.auth != null
              const entryCredentialSchema = resolveSchemaRoot(entry.schema)
              const hasFields = Object.keys(entryCredentialSchema?.properties ?? {}).length > 0

              return (
                <Card
                  key={entry.ref}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary ${isSelected ? 'border-primary' : selectedCredentialIndex === -1 ? '' : 'opacity-60'}`}
                  onClick={() => onSelectCredential(isSelected ? -1 : index)}
                >
                  <div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          <span className="text-sm font-medium">{entry.name ?? entry.ref}</span>
                          {entry.recommended ? <Badge variant="green">Recommended</Badge> : null}
                        </div>
                        <IntegrationSetupGuide
                          provider={provider}
                          connectionLabel={entry.name}
                          className="shrink-0"
                          onStartWizard={!isAuth && (hasFields || hasUserInputFields) ? () => handleStartWizard(index) : undefined}
                          liveValues={getLiveValues(connection)}
                        />
                      </div>
                      {connection?.description || entry.description ? <p className="ml-5 mt-0.5 text-xs text-muted-foreground">{connection?.description || entry.description}</p> : null}

                      {isSelected ? (
                        <div className="mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                          <div className="flex">
                            <div className="flex flex-1 flex-col min-w-0">
                              <h4 className="text-xs font-medium text-foreground mb-2">CREDENTIALS</h4>
                              {connection?.meta && Object.keys(connection.meta).length > 0 ? <ConnectionMetaSection meta={connection.meta} /> : null}
                              {hasFields ? (
                                <IntegrationSchemaSections sections={credentialSections} hideFieldKeys={disabledConfigKeys} />
                              ) : isAuth ? (
                                <p className="text-xs text-muted-foreground">No credentials to manage - you will be redirected to authorize access</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">No credential fields required</p>
                              )}

                              <div className="mt-3">
                                {isAuth && !hasFields && !hasUserInputFields ? (
                                  <Button type="button" onClick={onAuthConnect} disabled={isConnecting || !provider.active}>
                                    {isConnecting ? 'Initializing...' : 'Connect'}
                                  </Button>
                                ) : (
                                  <Button type="submit" disabled={isSubmitting || !provider.active}>
                                    {isSubmitting ? 'Saving...' : isAuth ? 'Continue to Authorization' : 'Save & Connect'}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {hasUserInputFields ? (
                              <>
                                <Separator vertical className="mx-6 w-fit self-stretch" separatorClass="h-full" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-medium text-foreground mb-2">CONFIGURATION</h4>
                                  <IntegrationSchemaSections sections={userInputSections} hideFieldKeys={disabledConfigKeys} />
                                </div>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </form>

        <IntegrationSetupWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          provider={provider}
          connectionLabel={activeEntry?.name}
          credentialSections={credentialSections}
          userInputSections={userInputSections}
          isAuth={activeIsAuth}
          isSubmitting={isSubmitting}
          formMethods={formMethods}
          onSubmit={onSubmit}
          closeSignal={selectedCredentialIndex}
          liveValues={getLiveValues(activeConnection)}
        />
      </FormProvider>
    </section>
  )
}

export default CredentialConnectionSection
