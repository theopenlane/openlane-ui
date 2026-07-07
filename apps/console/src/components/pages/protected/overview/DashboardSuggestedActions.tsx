import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { ClipboardList, FileText, Lock, Radar, UserRoundPlus, Waypoints, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { useDomainScanNotification } from '@/hooks/useDomainScanNotification'
import { consumeOnboardingImportControlsFlag, consumeOnboardingImportPoliciesFlag, hasOnboardingImportControlsFlag, hasOnboardingImportPoliciesFlag } from '@/lib/storage/onboarding-import'
import { OnboardingImportControlsWizard } from '@/components/pages/protected/controls/onboarding-import-controls-wizard'
import { OnboardingImportPoliciesWizard } from '@/components/pages/protected/policies/onboarding-import-policies-wizard'
import CreatePolicyUploadDialog from '@/components/pages/protected/policies/create/form/create-policy-upload-dialog'

const DashboardSuggestedActions = () => {
  const router = useRouter()
  const { currentOrgId } = useOrganization()
  const { domainScanNotification, canReviewDomainScanFindings, reviewDomainScanFindings } = useDomainScanNotification()
  const [showControlsRow, setShowControlsRow] = useState(false)
  const [showPoliciesRow, setShowPoliciesRow] = useState(false)
  const [openWizard, setOpenWizard] = useState<'controls' | 'policies' | null>(null)
  const uploadTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!currentOrgId) return
    setShowControlsRow(hasOnboardingImportControlsFlag(currentOrgId))
    setShowPoliciesRow(hasOnboardingImportPoliciesFlag(currentOrgId))
  }, [currentOrgId])

  const handleSecureOrganization = () => {
    router.push('/organization-settings/authentication')
  }

  const handleViewMembers = () => {
    router.push('/user-management/members')
  }

  const handleSetupIntegrations = () => {
    router.push('/automation/integrations')
  }

  const handleDismissControls = (e: React.MouseEvent) => {
    e.stopPropagation()
    consumeOnboardingImportControlsFlag(currentOrgId)
    setShowControlsRow(false)
  }

  const handleDismissPolicies = (e: React.MouseEvent) => {
    e.stopPropagation()
    consumeOnboardingImportPoliciesFlag(currentOrgId)
    setShowPoliciesRow(false)
  }

  const handleCloseWizard = () => {
    setOpenWizard(null)
    setShowControlsRow(hasOnboardingImportControlsFlag(currentOrgId))
    setShowPoliciesRow(hasOnboardingImportPoliciesFlag(currentOrgId))
  }

  const hoverClasses = 'transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-primary'
  const baseClasses = 'bg-homepage-card-item-transparent border border-homepage-card-border rounded-lg p-4 flex gap-4 items-start'

  return (
    <Card className="bg-homepage-card border-homepage-card-border">
      <CardTitle className="px-6 pt-6 text-lg font-semibold">
        <p>Suggested Actions</p>
        <p className="leading-5 text-sm text-muted-foreground font-normal pt-1">Keep your organization audit-ready with these recommended actions.</p>
      </CardTitle>

      <CardContent className="px-6 pb-6 pt-1">
        <div className="space-y-4">
          <div className={`${baseClasses} ${hoverClasses}`} onClick={handleSecureOrganization}>
            <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
              <Lock className="text-homepage-action-icon" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Secure your organization</p>
              <p className="text-xs text-muted-foreground">Set up Single-Sign On, allowed domains, and permissions to keep your org safe.</p>
            </div>
          </div>
          <div className={`${baseClasses} ${hoverClasses}`} onClick={handleViewMembers}>
            <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
              <UserRoundPlus className="text-homepage-action-icon" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Invite your team</p>
              <p className="text-xs text-muted-foreground">Add teammates so they can collaborate on controls, policies, and evidence.</p>
            </div>
          </div>

          <div className={`${baseClasses} ${hoverClasses}`} onClick={handleSetupIntegrations}>
            <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
              <Waypoints className="text-homepage-action-icon" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Setup Integrations</p>
              <p className="text-xs text-muted-foreground">Automatically sync data into openlane such as personnel, assets, or documents</p>
            </div>
          </div>

          {showControlsRow && (
            <div className={`${baseClasses} ${hoverClasses}`} onClick={() => setOpenWizard('controls')}>
              <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
                <ClipboardList className="text-homepage-action-icon" size={18} />
              </div>
              <div className="flex flex-1 items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">Import your controls</p>
                  <p className="text-xs text-muted-foreground">You told us you have existing controls — bring them in via CSV.</p>
                </div>
                <button type="button" onClick={handleDismissControls} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {showPoliciesRow && (
            <div className={`${baseClasses} ${hoverClasses}`} onClick={() => setOpenWizard('policies')}>
              <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
                <FileText className="text-homepage-action-icon" size={18} />
              </div>
              <div className="flex flex-1 items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">Import your policies</p>
                  <p className="text-xs text-muted-foreground">You told us you have existing policies — bring them in via upload or integration.</p>
                </div>
                <button type="button" onClick={handleDismissPolicies} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {canReviewDomainScanFindings && (
            <div className={`${baseClasses} ${hoverClasses}`} onClick={reviewDomainScanFindings}>
              <div className="p-2 rounded-md border border-homepage-card-border bg-nav">
                <Radar className="text-homepage-action-icon" size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">{domainScanNotification?.title || 'Your domain scan is ready'}</p>
                <p className="text-xs text-muted-foreground">{domainScanNotification?.body || 'Review the findings from your domain scan.'}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {openWizard === 'controls' && <OnboardingImportControlsWizard onClose={handleCloseWizard} />}
      {openWizard === 'policies' && <OnboardingImportPoliciesWizard onClose={handleCloseWizard} onChooseDocuments={() => uploadTriggerRef.current?.click()} />}
      <CreatePolicyUploadDialog trigger={<button ref={uploadTriggerRef} type="button" className="hidden" />} />
    </Card>
  )
}

export default DashboardSuggestedActions
