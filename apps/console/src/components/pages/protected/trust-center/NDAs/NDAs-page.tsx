'use client'

import React, { use, useEffect, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { FileText, Loader2, Eye, RefreshCw, FileUp, Plus, Upload } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { NDAUploadDialog } from './components/NDA-upload-dialog'
import { useGetTrustCenterNDAFiles } from '@/lib/graphql-hooks/trust-center-nda-request.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { formatDate } from '@/utils/date'
import FilePreviewDialog from '@/components/shared/file-preview/file-preview-dialog'
import { Callout } from '@/components/shared/callout/callout'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from '../branding/helpers/useHandleUpdateSetting'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import NdaRequestsTable from './table/nda-requests-table.tsx'
import { NdaAutoApprovalSettings } from './components/nda-auto-approval-settings'
import { NdaApprovalGroupCard } from './components/nda-approval-group-card'
import { NdaSwitchRow } from './components/nda-switch-row'
import { resolveAutoApprovalRules } from './auto-approval-rules'
import { ObjectTypes } from '@repo/codegen/src/type-names.ts'
import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { IMPORT_ROUTES } from '@/components/shared/record-import/lib/import-routes'
import { useOpenImport } from '@/components/shared/record-import/lib/use-open-import'

const NDAsPage = () => {
  const { latestFile, isLoading, latestTemplate } = useGetTrustCenterNDAFiles()
  const { setCrumbs } = use(BreadcrumbContext)
  const { data: trustCenterData } = useGetTrustCenter()
  const { updateTrustCenterSetting, isPending: isUpdatingSetting } = useHandleUpdateSetting()
  const { data: session } = useSession()
  const openImport = useOpenImport()

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const trustCenter = trustCenterData?.trustCenters?.edges?.[0]?.node
  const { data: tcPermission } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenter?.id)
  const canEditTc = canEdit(tcPermission?.roles, session)
  const canEditNdaRequest = hasPermission(tcPermission?.roles, AccessEnum.CanEditTrustCenterNdaRequest, session)
  const trustCenterSetting = trustCenter?.setting
  const ndaApprovalRequired = !!trustCenterSetting?.ndaApprovalRequired
  const cannotEditSetting = !trustCenterSetting?.id || !canEditTc
  const isSettingLocked = cannotEditSetting || isUpdatingSetting

  const handleUpdateSetting = async (input: UpdateTrustCenterSettingInput) => {
    if (!trustCenterSetting?.id) return false
    return !!(await updateTrustCenterSetting({ id: trustCenterSetting.id, input }))
  }

  const approvalCallout = (() => {
    if (!ndaApprovalRequired) return { variant: 'info' as const, text: 'Approval required: OFF — Auto-send NDA immediately upon request' }
    if (!trustCenterSetting?.enableAutoApproval) return { variant: 'info' as const, text: 'Approval requests will appear in the Needs Approval queue.' }
    if (!resolveAutoApprovalRules(trustCenterSetting).manualApprovalOnFailure) {
      return { variant: 'warning' as const, text: 'Requests that do not match an automatic approval rule are declined without manual review.' }
    }
    return { variant: 'info' as const, text: 'Automatic approval rules will be applied to incoming NDA requests.' }
  })()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'NDAs', href: '/trust-center/NDAs' },
    ])
  }, [setCrumbs])

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 justify-center py-8">
      <div className="grid w-full min-w-0 max-w-300 gap-4 px-6">
        <div>
          <PageHeading heading="Non-Disclosure Agreements" />
          <h3 className="mt-6 text-lg font-medium">NDA Document</h3>
        </div>

        <Card>
          <CardContent>
            {!latestFile ? (
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <FileUp size={24} />
                <div className="space-y-1">
                  <h4 className="text-lg font-semibold">No NDA uploaded</h4>
                  <p className="mt-1 text-sm text-muted-foreground">Upload the Non-Disclosure Agreement visitors must sign before accessing protected documents in your Trust Center.</p>
                  <p className="text-sm text-muted-foreground">This allows you to safely share sensitive materials such as SOC 2 reports, penetration tests, and other security documentation.</p>
                  <p className="text-sm text-muted-foreground">Protected documents require an NDA before they can be accessed.</p>
                </div>
                {canEditTc && (
                  <NDAUploadDialog
                    trigger={
                      <Button icon={<Plus />} iconPosition="left" {...tableActionAnchor(ObjectTypes.TRUST_CENTER_NDA_REQUEST, 'upload')}>
                        Upload
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-lg border bg-homepage-card-item border-muted p-4">
                  <div className="rounded-lg border border-muted p-2">
                    <FileText className="h-6 w-6 " />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{latestFile.providedFileName}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsPreviewOpen(true)} disabled={!latestFile.presignedURL}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {canEditTc && (
                      <NDAUploadDialog
                        ndaId={latestTemplate?.id}
                        trigger={
                          <Button variant="secondary" iconPosition="left" icon={<RefreshCw />}>
                            Replace
                          </Button>
                        }
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Last Updated • {formatDate(latestFile.updatedAt)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <FilePreviewDialog file={latestFile ? { ...latestFile, providedFileExtension: '' } : null} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />

        <div className="mt-4">
          <h3 className="text-lg font-medium">Access Rules</h3>
          <Card className="mt-3">
            <CardContent className="space-y-4">
              <NdaSwitchRow
                label="Require approval before NDA signing"
                description="When enabled, users must be approved before receiving the NDA signing link."
                checked={ndaApprovalRequired}
                onCheckedChange={(checked) => void handleUpdateSetting({ ndaApprovalRequired: checked })}
                disabled={isSettingLocked}
              />
              {ndaApprovalRequired && <NdaAutoApprovalSettings setting={trustCenterSetting} readOnly={cannotEditSetting} isSaving={isUpdatingSetting} onUpdate={handleUpdateSetting} />}
              <Callout variant={approvalCallout.variant} compact>
                {approvalCallout.text}
              </Callout>
            </CardContent>
          </Card>
        </div>
        {ndaApprovalRequired && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Approval Notification Recipients</h3>
            <NdaApprovalGroupCard selectedGroup={trustCenterSetting?.ndaApproverGroup} canEdit={canEditTc} disabled={isUpdatingSetting} onSelect={handleUpdateSetting} />
          </div>
        )}
        <div className="mt-4 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium">NDA Requests</h3>
            {canEditTc && (
              <DisabledReasonTooltip reason={latestFile ? null : 'Add your NDA Document first. Every NDA record is linked to it.'}>
                <Button variant="secondary" icon={<Upload size={16} />} iconPosition="left" disabled={!latestFile} onClick={() => openImport(IMPORT_ROUTES[ObjectTypes.TRUST_CENTER_NDA_REQUEST])}>
                  Import Signed NDAs
                </Button>
              </DisabledReasonTooltip>
            )}
          </div>

          <NdaRequestsTable requireApproval={ndaApprovalRequired} canRevoke={canEditNdaRequest} />
        </div>
      </div>
    </div>
  )
}

export default NDAsPage
