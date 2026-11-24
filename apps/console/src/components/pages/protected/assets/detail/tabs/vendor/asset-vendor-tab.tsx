'use client'

import React, { useState } from 'react'
import NextLink from 'next/link'
import { ArrowRight, Link2, X } from 'lucide-react'
import { Button, buttonStyles } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Card } from '@repo/ui/cardpanel'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { VendorStatusBadge } from '@/components/shared/enum-mapper/vendor-enum'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { VendorLogo } from '@/components/shared/vendor-logo/vendor-logo'
import { type AssetVendorNode } from '@/lib/graphql-hooks/asset-detail'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { getVendorLogoUrl } from '@/lib/vendor-logo'
import { formatDate } from '@/utils/date'
import { formatList } from '@/utils/strings'
import { DetailRow } from '../../detail-row'
import LinkRecordsDialog from '../relationships/link-records-dialog'
import { VendorPicker } from '../relationships/relationship-pickers'
import VendorAssetsTable from './vendor-assets-table'

type TAssetVendorTabProps = {
  assetId: string
  vendors: AssetVendorNode[]
  isPending: boolean
  isError: boolean
  canEdit: boolean
  handleUpdate: (input: UpdateAssetInput, options?: TPersistOptions) => Promise<void>
}

const yesNo = (value: boolean | null | undefined) => (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : null)

const soc2Label = ({ hasSoc2, soc2PeriodEnd }: AssetVendorNode) => {
  if (!hasSoc2) return 'Not on file'
  return soc2PeriodEnd ? `On file · period ends ${formatDate(soc2PeriodEnd)}` : 'On file'
}

const AssetVendorTab: React.FC<TAssetVendorTabProps> = ({ assetId, vendors, isPending, isError, canEdit, handleUpdate }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'link' | 'change' | 'unlink' | null>(null)
  const vendor = vendors.find(({ id }) => id === selectedId) ?? vendors[0]
  const linkedIds = vendors.map(({ id }) => id)
  const closeDialog = (open: boolean) => !open && setDialog(null)

  if (isPending) return <Skeleton height={240} className="w-full rounded-lg" role="status" aria-label="Loading vendor" />
  if (isError) return <EmptyTabState title="Vendor unavailable" description="The vendor linked to this asset could not be loaded." />

  const linkButton = canEdit && (
    <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left" onClick={() => setDialog('link')}>
      Link vendor
    </Button>
  )

  const pickerDialog = (dialog === 'link' || dialog === 'change') && (
    <LinkRecordsDialog
      title={dialog === 'change' ? 'Change vendor' : 'Link vendor'}
      onOpenChange={closeDialog}
      onSave={(input) => handleUpdate(input, { throwOnError: true })}
      fields={[
        {
          key: 'entityIDs',
          label: 'Vendor',
          linked: dialog === 'change' && vendor ? [{ id: vendor.id, name: vendorDisplayName(vendor) }] : [],
          renderPicker: (props) => <VendorPicker {...props} disabledIds={linkedIds.filter((id) => dialog === 'link' || id !== vendor?.id)} />,
        },
      ]}
    />
  )

  if (!vendor) {
    return (
      <div className="flex flex-col items-center">
        <EmptyTabState title="No vendor linked" description="Link the vendor that provides this asset." />
        {linkButton}
        {pickerDialog}
      </div>
    )
  }

  const name = vendorDisplayName(vendor)
  const domain = vendor.domains?.[0]

  return (
    <div className="space-y-5">
      {vendors.length > 1 && (
        <Tabs variant="solid" value={vendor.id} onValueChange={setSelectedId} className="max-w-full">
          <TabsList className="w-fit max-w-full overflow-x-auto">
            {vendors.map((option) => (
              <TabsTrigger key={option.id} value={option.id}>
                {vendorDisplayName(option)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div className="flex min-w-0 items-center gap-3">
          <VendorLogo name={name} logoUrl={getVendorLogoUrl(vendor.logoFile)} />
          <div className="min-w-0">
            <h2 className="text-lg font-medium break-words">{name}</h2>
            {domain && <ExternalLinkValue value={domain} className="text-sm" />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NextLink href={`/registry/vendors/${vendor.id}`} prefetch={false} className={cn(buttonStyles({ variant: 'secondary' }).base(), 'shrink-0')}>
            Open vendor
            <ArrowRight size={16} aria-hidden />
          </NextLink>
          {canEdit && (
            <>
              <Button type="button" variant="secondary" onClick={() => setDialog('change')}>
                Change vendor
              </Button>
              {linkButton}
              <Button type="button" variant="secondary" className="size-8 p-0" icon={<X size={16} />} descriptiveTooltipText="Unlink vendor" onClick={() => setDialog('unlink')} />
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-xl p-4">
          <h2 className="mb-2 text-lg font-medium">Vendor Profile</h2>
          <dl>
            <DetailRow label="Status" value={vendor.status && <VendorStatusBadge status={vendor.status} />} />
            <DetailRow label="Approved for use" value={yesNo(vendor.approvedForUse)} />
            <DetailRow label="Provided services" value={vendor.providedServices?.length ? formatList(vendor.providedServices, 'conjunction') : null} />
            <DetailRow label="SSO enforced" value={yesNo(vendor.ssoEnforced)} />
            <DetailRow label="MFA enforced" value={yesNo(vendor.mfaEnforced)} />
          </dl>
        </Card>
        <Card className="rounded-xl p-4">
          <h2 className="mb-2 text-lg font-medium">Risk and Review</h2>
          <dl>
            <DetailRow label="Tier" value={vendor.tier && getEnumLabel(vendor.tier)} />
            <DetailRow label="Risk rating" value={vendor.riskRating && <SeverityChip severity={vendor.riskRating} />} />
            <DetailRow label="Review frequency" value={vendor.reviewFrequency && getEnumLabel(vendor.reviewFrequency)} />
            <DetailRow label="Next review" value={vendor.nextReviewAt ? formatDate(vendor.nextReviewAt) : null} />
            <DetailRow label="SOC 2" value={soc2Label(vendor)} />
          </dl>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Other Assets from {name}</h2>
        <VendorAssetsTable key={vendor.id} vendorId={vendor.id} assetId={assetId} />
      </section>

      {pickerDialog}
      <ConfirmationDialog
        open={dialog === 'unlink'}
        onOpenChange={closeDialog}
        onConfirm={() => handleUpdate({ removeEntityIDs: [vendor.id] })}
        title={`Unlink ${name}?`}
        description="The vendor will no longer be linked to this asset. The vendor will not be deleted."
        confirmationText="Unlink"
        confirmationTextVariant="destructive"
      />
    </div>
  )
}

export default AssetVendorTab
