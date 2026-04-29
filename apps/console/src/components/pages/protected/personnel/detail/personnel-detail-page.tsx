'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import type { ResponsibilitySelection } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useNavigationGuard } from 'next-navigation-guard'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useIdentityHolder, useGetIdentityHolderAssociations, useUpdateIdentityHolder, useDeleteIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit, canDelete } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { useHasScrollbar } from '@/hooks/useHasScrollbar'
import { useOrganization } from '@/hooks/useOrganization'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type UpdateIdentityHolderInput, type IdentityHolderQuery } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { ASSOCIATION_REMOVAL_CONFIG } from '@/components/shared/object-association/object-association-config'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import PersonnelDetailHeader from './personnel-detail-header'
import PersonnelPropertiesSidebar from './personnel-properties-sidebar'
import PersonnelDetailTabs from './tabs/personnel-detail-tabs'
import type { EditPersonnelFormData } from '../hooks/use-form-schema'

interface PersonnelDetailPageProps {
  personnelId: string
}

const normalizeData = (data: IdentityHolderQuery['identityHolder']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
  })

const PersonnelDetailPage: React.FC<PersonnelDetailPageProps> = ({ personnelId }) => {
  const router = useRouter()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')

  const { data, isLoading, isError } = useIdentityHolder(personnelId)
  const { data: associationsData } = useGetIdentityHolderAssociations(personnelId)
  const { data: permission } = useAccountRoles(ObjectTypes.IDENTITY_HOLDER, personnelId)
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()
  const { mutateAsync: deleteIdentityHolder } = useDeleteIdentityHolder()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<EditPersonnelFormData>>({})

  const hasScrollbar = useHasScrollbar([isEditing, data?.identityHolder, associationsData?.identityHolder])

  const form = useForm<EditPersonnelFormData>({
    defaultValues: {},
  })

  const { isDirty } = form.formState
  const navGuard = useNavigationGuard({ enabled: isDirty })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Registry', href: '/registry/personnel' },
      { label: 'Personnel', href: '/registry/personnel' },
      { label: data?.identityHolder?.fullName || '', isLoading },
    ])
  }, [setCrumbs, data?.identityHolder, isLoading])

  useEffect(() => {
    if (data?.identityHolder && !isDirty) {
      const normalized = normalizeData(data.identityHolder)
      const newValues: Partial<EditPersonnelFormData> = {
        fullName: data.identityHolder.fullName ?? '',
        email: data.identityHolder.email ?? '',
        emailAliases: data.identityHolder.emailAliases ?? undefined,
        title: data.identityHolder.title ?? undefined,
        department: data.identityHolder.department ?? undefined,
        team: data.identityHolder.team ?? undefined,
        location: data.identityHolder.location ?? undefined,
        phoneNumber: data.identityHolder.phoneNumber ?? undefined,
        status: data.identityHolder.status ?? undefined,
        identityHolderType: data.identityHolder.identityHolderType ?? undefined,
        isActive: data.identityHolder.isActive ?? undefined,
        isOpenlaneUser: data.identityHolder.isOpenlaneUser ?? undefined,
        startDate: data.identityHolder.startDate ?? undefined,
        endDate: data.identityHolder.endDate ?? undefined,
        externalUserID: data.identityHolder.externalUserID ?? undefined,
        externalReferenceID: data.identityHolder.externalReferenceID ?? undefined,
        environmentName: data.identityHolder.environmentName ?? undefined,
        scopeName: data.identityHolder.scopeName ?? null,
        tags: data.identityHolder.tags ?? undefined,
        internalOwner: normalized.internalOwner as ResponsibilitySelection,
      }
      form.reset(newValues)
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setInitialValues(newValues)
    }
  }, [data?.identityHolder, form, isDirty])

  const onSubmit = async (values: EditPersonnelFormData) => {
    try {
      const changedFields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
        const initialValue = initialValues[key as keyof EditPersonnelFormData]
        if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
          acc[key] = value
        }
        return acc
      }, {})

      const { internalOwner, ...rest } = changedFields
      const input: UpdateIdentityHolderInput = {
        ...rest,
        ...(internalOwner ? buildResponsibilityPayload('internalOwner', internalOwner as ResponsibilitySelection, { mode: 'update' }) : {}),
      } as UpdateIdentityHolderInput

      if (Object.keys(input).length === 0) {
        setIsEditing(false)
        return
      }

      await updateIdentityHolder({ updateIdentityHolderId: personnelId, input })

      form.reset(values)
      setInitialValues(values)

      successNotification({
        title: 'Personnel updated',
        description: 'The personnel record was successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({ title: 'Failed to update personnel' })
    }
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset(initialValues as EditPersonnelFormData)
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleUpdateField = async (input: UpdateIdentityHolderInput, options?: { throwOnError?: boolean }) => {
    try {
      await updateIdentityHolder({ updateIdentityHolderId: personnelId, input })
      form.reset(form.getValues())
      successNotification({
        title: 'Personnel updated',
        description: 'The personnel record was successfully updated.',
      })
    } catch (error) {
      errorNotification({ title: 'Failed to update personnel' })

      if (options?.throwOnError) {
        throw error
      }
    }
  }

  const handleDeletePersonnel = async () => {
    try {
      await deleteIdentityHolder({ deleteIdentityHolderId: personnelId })
      successNotification({ title: 'Personnel deleted successfully.' })
      router.push('/registry/personnel')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const queryClient = useQueryClient()

  const memoizedSections = useMemo(() => {
    if (!associationsData?.identityHolder) return {}
    return {
      assets: associationsData.identityHolder.assets,
      entities: associationsData.identityHolder.entities,
      campaigns: associationsData.identityHolder.campaigns,
      tasks: associationsData.identityHolder.tasks,
      controls: associationsData.identityHolder.controls,
      subcontrols: associationsData.identityHolder.subcontrols,
      policies: associationsData.identityHolder.internalPolicies,
    }
  }, [associationsData?.identityHolder])

  const memoizedCenterNode = useMemo(() => {
    if (!data?.identityHolder) return null
    return {
      node: data.identityHolder,
      type: ObjectAssociationNodeEnum.IDENTITY_HOLDER,
    }
  }, [data?.identityHolder])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: personnelId,
    handleUpdateField: (input: UpdateIdentityHolderInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: [{ queryKey: ['identityHolders'], dataRootField: 'identityHolder', exact: false }],
    invalidateQueryKeys: [['identityHolders']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.identityHolder.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.identityHolder.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.identityHolder.sectionKeyToInvalidateQueryKey,
  })

  const personnel = data?.identityHolder
  const canEditPersonnel = canEdit(permission?.roles)
  const canDeletePersonnel = canDelete(permission?.roles)

  if (isLoading) {
    return null
  }

  if (isError || !personnel) {
    return <div className="p-4 text-red-500">Personnel not found</div>
  }

  const mainContent = (
    <div className="space-y-6">
      <PersonnelDetailHeader
        personnel={personnel}
        isEditing={isEditing}
        canEditPersonnel={canEditPersonnel}
        canDeletePersonnel={canDeletePersonnel}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDeleteClick={() => setIsDeleteDialogOpen(true)}
        handleUpdateField={handleUpdateField}
        onMergeComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['identityHolders', personnelId] })
          queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
        }}
      />

      <PersonnelDetailTabs personnel={personnel} isEditing={isEditing} canEdit={canEditPersonnel} handleUpdateField={handleUpdateField} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEditPersonnel} onRemoveAssociation={handleRemoveAssociation} />}
      <PersonnelPropertiesSidebar data={personnel} isEditing={isEditing} handleUpdate={handleUpdateField} canEdit={canEditPersonnel} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Personnel - ${personnel.fullName}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout
            sidebarTitle="Details"
            sidebarContent={sidebarContent}
            slideOpen={isEditing}
            minWidth={430}
            collapsedContentClassName="pr-6"
            collapsedButtonClassName="-translate-x-4"
            hasScrollbar={hasScrollbar}
          >
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeletePersonnel}
        title="Delete Personnel"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{personnel.fullName}</b> from the organization.
          </>
        }
      />

      <EvidenceDetailsSheet />
    </>
  )
}

export default PersonnelDetailPage
