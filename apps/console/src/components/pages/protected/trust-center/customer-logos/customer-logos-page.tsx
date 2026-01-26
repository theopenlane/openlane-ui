'use client'

import React, { useContext, useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'

import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useDeleteTrustCenterEntity, useGetTrustCenterEntities, useUpdateTrustCenterEntity } from '@/lib/graphql-hooks/trust-center-entities'
import CreateCustomerLogo from './create-customer-logo'
import CustomerLogoCard from './customer-logo-card'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

export default function CustomerLogosPage() {
  const { setCrumbs } = useContext(BreadcrumbContext)

  const [entityToDelete, setEntityToDelete] = useState<string | null>(null)

  const { successNotification, errorNotification } = useNotification()

  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''
  const { entities } = useGetTrustCenterEntities({})
  const { mutateAsync: deleteEntity } = useDeleteTrustCenterEntity()
  const { mutateAsync: updateEntity } = useUpdateTrustCenterEntity()

  const handleDelete = async () => {
    if (!entityToDelete) return
    try {
      await deleteEntity({ deleteTrustCenterEntityId: entityToDelete })
      successNotification({ title: 'Customer removed' })
      setEntityToDelete(null)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const onUpdate = async ({ id, url, logoFile }: { id: string; url?: string; logoFile?: File }) => {
    try {
      await updateEntity({
        input: { url },
        updateTrustCenterEntityId: id,
        logoFile: logoFile,
      })
      successNotification({ title: 'Customer updated' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Customer Logos', href: '/trust-center/customer-logos' }])
  }, [setCrumbs])

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 min-h-screen text-foreground">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Customer Logos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreateCustomerLogo trustCenterID={trustCenterID} />

        <div className="relative min-h-[400px]">
          {entities.length === 0 ? (
            <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8 border-muted">
              <Building2 size={24} className="mb-4 text-muted-foreground" />
              <h3 className="text-sm font-medium mb-1 text-foreground">No companies added yet</h3>
              <p className="text-sm text-muted-foreground">Add your first customer logo to see it here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {entities.map((entity) => (
                <CustomerLogoCard
                  onUpdate={onUpdate}
                  key={entity.id}
                  id={entity.id}
                  name={entity.name}
                  logoUrl={entity.logoFile?.presignedURL ?? null}
                  onDelete={(id) => setEntityToDelete(id)}
                  url={entity.url}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={!!entityToDelete}
        onOpenChange={(open) => !open && setEntityToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description="Are you sure you want to remove this customer logo? This action cannot be undone."
      />
    </div>
  )
}
