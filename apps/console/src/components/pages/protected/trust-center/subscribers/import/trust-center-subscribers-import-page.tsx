'use client'

import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type CreateSubscriberInput } from '@repo/codegen/src/schema'
import { RecordImportPage, RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { trustCenterSubscribersImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { defineFixedImportField } from '@/components/shared/record-import/lib/import-registry'
import { useCreateBulkCSVSubscriber } from '@/lib/graphql-hooks/subscriber'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useAccountRoles } from '@/lib/query-hooks/permissions'

const TrustCenterSubscribersImportPage: React.FC<{ trustCenterId: string }> = ({ trustCenterId }) => {
  const route = trustCenterSubscribersImportRoute(trustCenterId)
  const { data, isPending, isError } = useGetTrustCenter()
  const { data: permission, isPending: isPermissionPending } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterId)
  const { mutateAsync } = useCreateBulkCSVSubscriber()

  const trustCenter = data?.trustCenters?.edges?.find((edge) => edge?.node?.id === trustCenterId)?.node
  const trustCenterName = trustCenter?.setting?.title || trustCenter?.setting?.companyName || trustCenter?.slug || 'your trust center'

  const fixedFields = useMemo(
    () => [defineFixedImportField<CreateSubscriberInput>({ field: 'trustCenterID', label: 'Trust Center', value: trustCenterId, valueLabel: trustCenterName })],
    [trustCenterId, trustCenterName],
  )

  if (isPending) return <RecordImportSkeleton />

  if (isError || !trustCenter) {
    return <RecordImportUnavailable message={<p>Trust center not found.</p>} backHref={route.listHref} backLabel="Back to Subscribers" />
  }

  if (!trustCenter.setting?.allowSubscribers) {
    return (
      <RecordImportUnavailable
        message={
          <>
            <p>{trustCenterName} is not accepting new subscribers, so they cannot be imported.</p>
            <p className="mt-1">Turn on Allow new subscribers on the Subscribers page, then try again.</p>
          </>
        }
        backHref={route.listHref}
        backLabel="Back to Subscribers"
      />
    )
  }

  return (
    <RecordImportPage
      entityType={ObjectTypes.SUBSCRIBER}
      route={route}
      roles={{ roles: permission?.roles, isPending: isPermissionPending }}
      fixedFields={fixedFields}
      onImport={(mapped) => mutateAsync({ input: mapped.toFile() })}
    />
  )
}

export default TrustCenterSubscribersImportPage
