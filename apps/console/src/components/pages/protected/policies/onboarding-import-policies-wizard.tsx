'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { defineStepper } from '@stepperize/react'
import { ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useOrganization } from '@/hooks/useOrganization'
import { consumeOnboardingImportPoliciesFlag } from '@/lib/storage/onboarding-import'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import ProviderIcon from '@/components/pages/protected/integrations/provider-icon'

type ImportMethod = 'documents' | 'integration'

const { useStepper } = defineStepper({ id: 'method', label: 'Method' }, { id: 'integration', label: 'Choose integration' })

type Props = { onClose: () => void; onChooseDocuments: () => void }

export const OnboardingImportPoliciesWizard = ({ onClose, onChooseDocuments }: Props) => {
  const { currentOrgId } = useOrganization()
  const router = useRouter()
  const stepper = useStepper()
  const [method, setMethod] = useState<ImportMethod | undefined>(undefined)
  const { data: providersData } = useIntegrationProviders()

  const documentProviders = useMemo(() => (providersData?.providers ?? []).filter((provider) => provider.tags?.includes('document')), [providersData])

  const handleNext = () => {
    if (!method) return

    if (method === 'documents') {
      consumeOnboardingImportPoliciesFlag(currentOrgId)
      onClose()
      onChooseDocuments()
      return
    }

    stepper.next()
  }

  const handleChooseIntegration = (providerId: string) => {
    consumeOnboardingImportPoliciesFlag(currentOrgId)
    onClose()
    router.push(`/automation/integrations/${providerId}`)
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      onClose()
    } else {
      stepper.prev()
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[640px] bg-secondary" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Import Your Policies</DialogTitle>
        </DialogHeader>

        <StepHeader stepper={stepper} />

        {stepper.current.id === 'method' && (
          <div className="space-y-3">
            <Label>How would you like to bring in your policies?</Label>
            <RadioGroup value={method} onValueChange={(value) => setMethod(value as ImportMethod)} className="grid gap-3">
              <Label htmlFor="method-documents" variant="card" selected={method === 'documents'}>
                <RadioGroupItem id="method-documents" value="documents" className="mt-0.5" />
                <span className="block">
                  <span className="block font-semibold">Bulk import existing documents</span>
                  <span className="block text-xs text-text-light">Upload files directly and we&apos;ll create a policy for each one.</span>
                </span>
              </Label>
              <Label htmlFor="method-integration" variant="card" selected={method === 'integration'}>
                <RadioGroupItem id="method-integration" value="integration" className="mt-0.5" />
                <span className="block">
                  <span className="block font-semibold">Set up an integration</span>
                  <span className="block text-xs text-text-light">Sync policies directly from Google Drive or Microsoft/OneDrive.</span>
                </span>
              </Label>
            </RadioGroup>
          </div>
        )}

        {stepper.current.id === 'integration' && (
          <div className="space-y-3">
            <Label>Which integration would you like to set up?</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {documentProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleChooseIntegration(provider.id)}
                  className="flex items-start gap-3 rounded-md border border-border p-4 text-left transition-colors hover:border-primary"
                >
                  <div className="relative w-[32px] h-[32px] shrink-0 rounded-full border flex items-center justify-center">
                    <ProviderIcon providerName={provider.displayName} logoUrl={provider.logoUrl} className="object-contain" />
                  </div>
                  <div>
                    <p className="font-semibold">{provider.displayName}</p>
                    {provider.description && <p className="mt-1 text-xs text-text-light">{provider.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {stepper.isFirst ? (
            <CancelButton onClick={handleBack} title="Cancel" />
          ) : (
            <Button type="button" variant="secondary" onClick={handleBack} icon={<ArrowLeft />} iconPosition="left">
              Back
            </Button>
          )}
          {stepper.current.id === 'method' && (
            <Button type="button" onClick={handleNext} disabled={!method}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
