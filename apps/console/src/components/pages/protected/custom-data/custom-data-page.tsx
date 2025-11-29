'use client'
import React, { useContext, useEffect } from 'react'
import { canEdit } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const CustomDataPage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Custom Data', href: '/organization-settings/custom-data' },
    ])
  }, [setCrumbs])

  return (
    <>
      {!isLoading && !canEdit(permission?.roles) && <ProtectedArea />}
      {!isLoading && canEdit(permission?.roles) && (
        <div>
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h1 className="text-2xl font-medium leading-8 text-header">Custom Data</h1>
            </div>
          </div>
          <p className="text-sm leading-5 font-normal text-muted-foreground pt-1">Manage organization-specific tags, labels, and enums that define your compliance structure.</p>
        </div>
      )}
    </>
  )
}

export default CustomDataPage
