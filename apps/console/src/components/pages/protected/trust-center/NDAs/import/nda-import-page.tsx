'use client'

import React, { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type CreateTrustCenterNdaRequestInput, TrustCenterNdaRequestTrustCenterNdaRequestStatus } from '@repo/codegen/src/schema'
import { RecordImportPage, RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { IMPORT_ROUTES, IMPORT_SECTIONS } from '@/components/shared/record-import/lib/import-routes'
import { defineFixedImportField } from '@/components/shared/record-import/lib/import-registry'
import { type TMappedImport } from '@/components/shared/record-import/lib/types'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useCreateBulkCSVTrustCenterNdaRequest, useFindExistingNdaRequestEmails, useGetTrustCenterNDAFiles } from '@/lib/graphql-hooks/trust-center-nda-request'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { formatTruncatedList, pluralize, pluralizeWithCount } from '@/utils/strings'
import { readImportEmails } from './nda-import-emails'

const MAX_LISTED_EMAILS = 5

const SIGNED = TrustCenterNdaRequestTrustCenterNdaRequestStatus.SIGNED

const NDA_ROUTE = IMPORT_ROUTES[ObjectTypes.TRUST_CENTER_NDA_REQUEST]

const NdaImportPage: React.FC = () => {
  const { trustCenter, isPending: isTrustCenterPending, isPlaceholderData: isTrustCenterPlaceholder, isError: isTrustCenterError } = useGetTrustCenter()
  const trustCenterId = trustCenter?.id
  const trustCenterSlug = trustCenter?.slug
  const { latestFile, isPending: isTemplatePending, isPlaceholderData: isTemplatePlaceholder, isError: isTemplateError } = useGetTrustCenterNDAFiles(Boolean(trustCenterId))
  const { data: permission, isPending: isPermissionPending } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterId)
  const { mutateAsync: createBulkCSV } = useCreateBulkCSVTrustCenterNdaRequest()
  const findExistingEmails = useFindExistingNdaRequestEmails()

  const fixedFields = useMemo(
    () =>
      trustCenterId
        ? [
            defineFixedImportField<CreateTrustCenterNdaRequestInput>({ field: 'status', label: 'Status', value: SIGNED, valueLabel: getEnumLabel(SIGNED) }),
            defineFixedImportField<CreateTrustCenterNdaRequestInput>({ field: 'trustCenterID', label: 'Trust Center', value: trustCenterId, valueLabel: trustCenterSlug ?? trustCenterId }),
          ]
        : undefined,
    [trustCenterId, trustCenterSlug],
  )

  if (isTrustCenterPending || isTrustCenterPlaceholder || (trustCenterId && (isTemplatePending || isTemplatePlaceholder))) return <RecordImportSkeleton />

  if (isTrustCenterError || !trustCenterId) {
    return (
      <RecordImportUnavailable
        message={<p>{isTrustCenterError ? 'Your Trust Center could not be loaded. Please try again later.' : 'Set up your Trust Center before importing signed NDAs.'}</p>}
        backLabel={`Back to ${IMPORT_SECTIONS.trustCenter.label}`}
        backHref={IMPORT_SECTIONS.trustCenter.href}
      />
    )
  }

  if (isTemplateError) {
    return <RecordImportUnavailable message={<p>Your NDA document could not be loaded. Please try again later.</p>} backLabel={`Back to ${NDA_ROUTE.listLabel}`} backHref={NDA_ROUTE.listHref} />
  }

  if (!latestFile) {
    return (
      <RecordImportUnavailable
        message={<p>Add your NDA Document on the NDAs page first. Openlane links every NDA record, including imported ones, to the NDA your visitors sign.</p>}
        backLabel={`Back to ${NDA_ROUTE.listLabel}`}
        backHref={NDA_ROUTE.listHref}
      />
    )
  }

  const handleImport = async (mapped: TMappedImport) => {
    const existing = await findExistingEmails(trustCenterId, readImportEmails(mapped.toRecords()))
    if (existing.length > 0) {
      throw new UserFacingError(
        `${pluralizeWithCount(existing.length, 'person', 'people')} already ${pluralize(existing.length, 'has', 'have')} an NDA record in your Trust Center: ${formatTruncatedList(existing, existing.length, MAX_LISTED_EMAILS)}. Remove ${pluralize(existing.length, 'that row', 'those rows')} and import again.`,
      )
    }

    await createBulkCSV({ input: mapped.toFile() })
  }

  return <RecordImportPage entityType={ObjectTypes.TRUST_CENTER_NDA_REQUEST} roles={{ roles: permission?.roles, isPending: isPermissionPending }} fixedFields={fixedFields} onImport={handleImport} />
}

export default NdaImportPage
