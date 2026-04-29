'use client'

import React, { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { MoreHorizontal, Trash2, Building2, PencilIcon, CogIcon, CheckIcon } from 'lucide-react'
import { canDelete } from '@/lib/authz/utils'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import Menu from '@/components/shared/menu/menu'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { VendorLogoDialog } from '../vendor-logo-dialog'
import { useUpdateEntityLogo } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import type { TAccessRole } from '@/types/authz'
import type { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import { toBase64DataUri } from '@/lib/image-utils'
import Link from 'next/link'
import { MergeMenuItem } from '@/components/shared/merge-records/merge-menu-item'
import { vendorMergeConfig } from '@/components/shared/merge-records/configs/vendor-merge-config'

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
  const { setValue, register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'name' | 'displayName' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const originalValueRef = useRef<string>('')
  const [logoDialogOpen, setLogoDialogOpen] = useState(false)
  const { mutateAsync: updateLogo, isPending: isLogoUploading } = useUpdateEntityLogo()
  const { successNotification, errorNotification } = useNotification()
  const hasIntegration = (vendor.integrations.edges?.length || 0) > 0 && vendor?.integrations?.edges?.[0]?.node != null
  const integrationDefId = hasIntegration ? vendor?.integrations?.edges?.[0]?.node?.definitionID : ''

  const logoUrl = vendor.logoFile?.base64 ? toBase64DataUri(vendor.logoFile.base64) : undefined

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
    if (localValue !== originalValueRef.current) {
      setValue(field, localValue)
      await handleUpdateField({ [field]: localValue })
    }
    setInlineEditing(null)
  }

  const handleEscape = (field: 'name' | 'displayName') => {
    setValue(field, originalValueRef.current)
    setInlineEditing(null)
  }

  const startEditing = (field: 'name' | 'displayName') => {
    if (!canEditVendor || isEditing) return
    const current = (field === 'name' ? vendor.name : vendor.displayName) ?? ''
    originalValueRef.current = current
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
        <div className="flex items-center gap-4">
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
          <div className="flex flex-col gap-1">
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

        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex gap-2 justify-end">
              <CancelButton onClick={onCancel} />
              <SaveButton />
            </div>
          ) : (
            <>
              {canEditVendor && (
                <Button type="button" variant="secondary" onClick={onEdit} aria-label="Edit vendor" icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
                  Edit
                </Button>
              )}
              {(canEditVendor || canDeleteVendor) && (
                <Menu
                  trigger={
                    <Button type="button" variant="secondary" className="h-8 px-2">
                      <MoreHorizontal size={16} />
                    </Button>
                  }
                  content={
                    <>
                      {hasIntegration && integrationDefId !== '' && (
                        <Link href={`/organization-settings/integrations/${integrationDefId}`} className="flex items-center space-x-2 px-1 cursor-pointer">
                          <CogIcon size={16} strokeWidth={2} />
                          <span>Configure Integration</span>
                        </Link>
                      )}
                      {canEditVendor && <MergeMenuItem primaryId={vendor.id} config={vendorMergeConfig} onMergeComplete={onMergeComplete} />}
                      {canDeleteVendor && (
                        <button onClick={onDeleteClick} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer text-destructive">
                          <Trash2 size={16} strokeWidth={2} />
                          <span>Delete</span>
                        </button>
                      )}
                    </>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

      <VendorLogoDialog
        open={logoDialogOpen}
        onOpenChange={setLogoDialogOpen}
        vendorName={vendor.name ?? ''}
        vendorDisplayName={vendor.displayName ?? undefined}
        onLogoSelect={handleLogoSelect}
        isLoading={isLogoUploading}
      />
    </>
  )
}

export default VendorDetailHeader
