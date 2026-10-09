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
import { Switch } from '@repo/ui/switch'
import { Label } from '@repo/ui/label'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useHandleUpdateSetting } from '../branding/helpers/useHandleUpdateSetting'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import NdaRequestsTable from './table/nda-requests-table.tsx'
import { NdaAutoApprovalSettings } from './components/nda-auto-approval-settings'
import { NdaApprovalGroupCard } from './components/nda-approval-group-card'
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
  const shouldDisableAutoApprovalRules = isUpdatingSetting || !trustCenterSetting?.id || !canEditTc

  const handleUpdateSetting = (input: UpdateTrustCenterSettingInput) => {
    if (!trustCenterSetting?.id) return
    updateTrustCenterSetting({ id: trustCenterSetting.id, input })
  }

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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="nda-approval-required" className="text-sm font-medium">
                    Require approval before NDA signing
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">When enabled, users must be approved before receiving the NDA signing link.</p>
                </div>
                <Switch
                  id="nda-approval-required"
                  checked={ndaApprovalRequired}
                  onCheckedChange={(checked) => handleUpdateSetting({ ndaApprovalRequired: checked })}
                  disabled={shouldDisableAutoApprovalRules}
                />
              </div>
              {ndaApprovalRequired && <NdaAutoApprovalSettings setting={trustCenterSetting} disabled={shouldDisableAutoApprovalRules} onUpdate={handleUpdateSetting} />}
              <Callout variant="info" compact>
                {ndaApprovalRequired
                  ? trustCenterSetting?.enableAutoApproval
                    ? 'Automatic approval rules will be applied to incoming NDA requests.'
                    : 'Approval requests will appear in the Needs Approval queue.'
                  : 'Approval required: OFF — Auto-send NDA immediately upon request'}
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
