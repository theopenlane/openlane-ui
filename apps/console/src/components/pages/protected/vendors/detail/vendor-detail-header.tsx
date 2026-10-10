'use client'

import React, { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { Building2, PencilIcon, CogIcon, CheckIcon, PlusIcon } from 'lucide-react'
import { canDelete } from '@/lib/authz/utils'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { VendorLogoDialog } from '../vendor-logo-dialog'
import { useUpdateEntityLogo } from '@/lib/graphql-hooks/entity'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { matchProviderByVendorName } from '@/lib/integrations/utils'
import { useNotification } from '@/hooks/useNotification'
import type { TAccessRole } from '@/types/authz'
import type { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import { getVendorLogoUrl } from '@/lib/vendor-logo'
import { MergeRecordsSheet } from '@/components/shared/merge-records/merge-records-sheet'
import { vendorMergeConfig } from '@/components/shared/merge-records/configs/vendor-merge-config'
import { deleteMenuAction, mergeMenuAction } from '@/components/shared/crud-base/slideout-header'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'

interface VendorDetailHeaderProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  canEditVendor: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  permissionRoles?: TAccessRole[]
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
  onMergeComplete?: () => void
}

const VendorDetailHeader: React.FC<VendorDetailHeaderProps> = ({ vendor, isEditing, canEditVendor, onEdit, onCancel, onDeleteClick, permissionRoles, handleUpdateField, onMergeComplete }) => {
  const canDeleteVendor = canDelete(permissionRoles)
  const [mergeOpen, setMergeOpen] = useState(false)
  const { setValue, register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'name' | 'displayName' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [logoDialogOpen, setLogoDialogOpen] = useState(false)
  const { mutateAsync: updateLogo, isPending: isLogoUploading } = useUpdateEntityLogo()
  const { successNotification, errorNotification } = useNotification()
  const hasIntegration = (vendor.integrations.edges?.length || 0) > 0 && vendor?.integrations?.edges?.[0]?.node != null
  const integrationDefId = hasIntegration ? vendor?.integrations?.edges?.[0]?.node?.definitionID : ''

  const { data: providersData } = useIntegrationProviders()
  const matchedProvider = useMemo(
    () => (hasIntegration ? undefined : matchProviderByVendorName(vendor.name, vendor.displayName, providersData?.providers ?? [])),
    [hasIntegration, vendor.name, vendor.displayName, providersData?.providers],
  )

  const logoUrl = getVendorLogoUrl(vendor.logoFile)

  const handleLogoSelect = async (file: File) => {
    try {
      await updateLogo({ updateEntityId: vendor.id, input: {}, logoFile: file })
      successNotification({ title: 'Logo updated', description: 'The vendor logo was successfully updated.' })
    } catch (error) {
      errorNotification({ title: 'Failed to update logo' })
      throw error
    }
  }

  const handleBlur = async (field: 'name' | 'displayName') => {
    if (localValue !== originalValue) {
      setValue(field, localValue)
      await handleUpdateField({ [field]: localValue })
    }
    setInlineEditing(null)
  }

  const handleEscape = (field: 'name' | 'displayName') => {
    setValue(field, originalValue)
    setInlineEditing(null)
  }

  const startEditing = (field: 'name' | 'displayName') => {
    if (!canEditVendor || isEditing) return
    const current = (field === 'name' ? vendor.name : vendor.displayName) ?? ''
    setOriginalValue(current)
    setLocalValue(current)
    setInlineEditing(field)
  }

  const renderInlineField = (field: 'name' | 'displayName') => {
    return (
      <Input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={field === 'name' ? 'text-2xl font-semibold h-auto py-1' : 'text-sm h-auto py-0.5'}
        onBlur={() => handleBlur(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') handleEscape(field)
        }}
      />
    )
  }

  return (
    <>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            type="button"
            className="group/logo relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden border-0 p-0 cursor-pointer"
            onClick={() => canEditVendor && setLogoDialogOpen(true)}
            disabled={!canEditVendor}
            aria-label="Edit vendor logo"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={vendor.name ?? 'Vendor logo'} className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 size={24} className="text-muted-foreground" />
            )}
            {canEditVendor && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/logo:opacity-100 rounded-lg">
                <PencilIcon size={16} className="text-white" />
              </div>
            )}
          </button>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {isEditing ? (
              <Input {...register('name')} className="text-2xl font-semibold h-auto py-1" />
            ) : inlineEditing === 'name' ? (
              renderInlineField('name')
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <HoverPencilWrapper showPencil={canEditVendor} onPencilClick={() => startEditing('name')} className="min-w-0">
                  <h1 className="text-2xl font-semibold truncate" onDoubleClick={() => startEditing('name')}>
                    {vendor.name}
                  </h1>
                </HoverPencilWrapper>
                {vendor.approvedForUse && (
                  <Badge variant="green" className="shrink-0">
                    Approved
                  </Badge>
                )}
                {hasIntegration && (
                  <Badge variant="green" className="shrink-0 flex items-center gap-1">
                    <CheckIcon size={11} strokeWidth={2.5} />
                    Integration
                  </Badge>
                )}
              </div>
            )}
            {isEditing ? (
              <Input {...register('displayName')} className="text-sm h-auto py-0.5" placeholder="Display name" />
            ) : inlineEditing === 'displayName' ? (
              renderInlineField('displayName')
            ) : vendor.displayName ? (
              <HoverPencilWrapper showPencil={canEditVendor} onPencilClick={() => startEditing('displayName')}>
                <p className="text-sm text-muted-foreground" onDoubleClick={() => startEditing('displayName')}>
                  {vendor.displayName}
                </p>
              </HoverPencilWrapper>
            ) : null}
          </div>
        </div>

        <DetailHeaderActions
          isEditing={isEditing}
          onCancel={onCancel}
          onEdit={canEditVendor ? onEdit : undefined}
          editLabel="Edit vendor"
          menuAnchor={elementAnchor('vendor-actions-menu')}
          menuActions={[
            canEditVendor &&
              !hasIntegration &&
              matchedProvider && {
                key: 'add-integration',
                label: 'Add Integration',
                icon: <PlusIcon size={16} strokeWidth={2} />,
                href: `/automation/integrations/${matchedProvider.id}?vendorId=${vendor.id}`,
              },
            canEditVendor &&
              hasIntegration &&
              integrationDefId !== '' && {
                key: 'configure-integration',
                label: 'Configure Integration',
                icon: <CogIcon size={16} strokeWidth={2} />,
                href: `/automation/integrations/${integrationDefId}`,
              },
            canEditVendor && mergeMenuAction(() => setMergeOpen(true)),
            canDeleteVendor && deleteMenuAction(onDeleteClick),
          ]}
        />
      </div>

      {canEditVendor && <MergeRecordsSheet open={mergeOpen} onOpenChange={setMergeOpen} config={vendorMergeConfig} primaryId={vendor.id} onMergeComplete={onMergeComplete} />}

      <VendorLogoDialog
        open={logoDialogOpen}
        onOpenChange={setLogoDialogOpen}
        vendorName={vendor.name ?? ''}
        vendorDisplayName={vendor.displayName ?? undefined}
        domains={vendor.domains ?? undefined}
        onLogoSelect={handleLogoSelect}
        isLoading={isLogoUploading}
      />
    </>
  )
}

export default VendorDetailHeader
