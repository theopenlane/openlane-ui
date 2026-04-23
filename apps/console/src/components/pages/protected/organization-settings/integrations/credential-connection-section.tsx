'use client'

import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { getProviderHelperContent } from '@/lib/integrations/provider-helper-content'
import { type IntegrationProvider } from '@/lib/integrations/types'
import { type FormValues, type SchemaSection } from '@/lib/integrations/schema'
import { resolveConnectionEntry, resolveSchemaRoot } from '@/lib/integrations/utils'
import { IntegrationSchemaSections } from './schema-form'

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
  const providerHelper = getProviderHelperContent(provider)

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
                      <div className="flex items-center gap-2">
                        {isSelected ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className="text-sm font-medium">{entry.name ?? entry.ref}</span>
                        {entry.recommended ? <Badge variant="green">Recommended</Badge> : null}
                      </div>
                      {connection?.description || entry.description ? <p className="ml-5 mt-0.5 text-xs text-muted-foreground">{connection?.description || entry.description}</p> : null}

                      {isSelected ? (
                        <div className="mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                          {providerHelper ? <div className="mb-3">{providerHelper}</div> : null}
                          <div className="flex">
                            <div className="flex flex-1 flex-col min-w-0">
                              <h4 className="text-xs font-medium text-foreground mb-2">CREDENTIALS</h4>
                              {hasFields ? (
                                <IntegrationSchemaSections sections={credentialSections} />
                              ) : isAuth ? (
                                <p className="text-xs text-muted-foreground">No credentials to manage - you will be redirected to authorize access</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">No credential fields required</p>
                              )}

                              <div className="mt-auto pt-3">
                                {isAuth && !hasFields ? (
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
                                  <IntegrationSchemaSections sections={userInputSections} />
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
      </FormProvider>
    </section>
  )
}

export default CredentialConnectionSection
