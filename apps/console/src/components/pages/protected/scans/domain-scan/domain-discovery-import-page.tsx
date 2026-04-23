'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateBulkEntity, useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useAssetsWithFilter, useCreateBulkAsset } from '@/lib/graphql-hooks/asset'
import { useCreateBulkFinding } from '@/lib/graphql-hooks/finding'
import { AssetAssetType, AssetSourceType, FindingSecurityLevel, type CreateAssetInput, type CreateEntityInput, type CreateFindingInput } from '@repo/codegen/src/schema'

type Vendor = {
  id: string
  name: string
  tags: string[]
  description?: string
  confidence?: string
}

type DomainItem = {
  id: string
  name: string
  primary?: boolean
}

type Finding = {
  id: string
  title: string
  description?: string
  severity?: string
  rawPayload?: DomainScanFindingPayload
}

type DomainScanVendorPayload = {
  name?: string
  url?: string
  categories?: string[]
}

type DomainScanDnsRecordPayload = {
  domain?: string
}

type DomainScanFindingPayload = {
  id?: string
  title?: string
  description?: string
  severity?: string
  name?: string
  summary?: string
  details?: string
}

type DomainScanNotificationData = {
  url?: string
  scan_id?: string
  vendors?: DomainScanVendorPayload[]
  assets?: {
    dns_records?: DomainScanDnsRecordPayload[]
  }
  findings?: {
    risks?: DomainScanFindingPayload[]
    security_violations?: DomainScanFindingPayload[]
  }
}

const { useStepper } = defineStepper(
  { id: 'vendors', label: 'Review vendors' },
  { id: 'assets', label: 'Review assets' },
  { id: 'findings', label: 'Review findings' },
  { id: 'confirm', label: 'Confirm import' },
)

const unknownDomain = 'Unknown domain'

// this converts the entity name to normalized values like what the backend stores.
// we need this to prevent a user from adding the same entity twice as that would fail
//
//  Google Tag Manager -> google-tag-manager
//  Node.js -> node-js
const canocalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const canocalizeLookupValue = (value?: string | null) => value?.trim().toLowerCase() || ''

const sanitizeEntityName = (value: string) => {
  return value.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || canocalizeEntityName(value)
}

const vendorsFromNotification = (data?: DomainScanNotificationData): Vendor[] => {
  const vendors = data?.vendors
  if (!vendors || vendors.length === 0) return []

  const mapByName = new Map<string, Vendor>()

  const unknownVendor = 'Unknown vendor'

  vendors.forEach((vendor) => {
    const name = vendor.name || unknownVendor

    const key = canocalizeLookupValue(name) || canocalizeLookupValue(sanitizeEntityName(name)) || canocalizeLookupValue(vendor.url) || 'vendor'

    const existingVendor = mapByName.get(key)

    if (!existingVendor) {
      mapByName.set(key, {
        id: canocalizeEntityName(name || vendor.url || 'vendor'),
        name,
        tags: vendor.categories?.length ? vendor.categories : [],
        description: vendor.url,
      })
      return
    }

    existingVendor.tags = Array.from(new Set([...existingVendor.tags, ...(vendor.categories || [])]))
    existingVendor.description = existingVendor.description || vendor.url
  })

  return Array.from(mapByName.values())
}

const extractHostFromURL = (value?: string) => {
  if (!value) {
    return unknownDomain
  }

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return unknownDomain
  }
}

const domainsFromNotification = (data?: DomainScanNotificationData): { owned: DomainItem[]; external: DomainItem[]; hostname: string } => {
  const hostname = extractHostFromURL(data?.url)

  const domains = Array.from(new Set((data?.assets?.dns_records || []).map((record) => record.domain?.toLowerCase()).filter(Boolean as unknown as (value: string | undefined) => value is string)))

  if (domains.length === 0) {
    return {
      owned: hostname === unknownDomain ? [] : [{ id: canocalizeEntityName(hostname), name: hostname, primary: true }],
      external: [],
      hostname,
    }
  }

  const ownedDomains: DomainItem[] = domains
    // endsWith is a quick way to find out if it is a subdomain
    .filter((domain) => domain === hostname || domain.endsWith(`.${hostname}`))
    .map((domain) => ({ id: canocalizeEntityName(domain), name: domain, primary: domain === hostname }))

  const externalDomains: DomainItem[] = domains.filter((domain) => !ownedDomains.some((item) => item.name === domain)).map((domain) => ({ id: canocalizeEntityName(domain), name: domain }))

  return {
    owned: ownedDomains.length > 0 ? ownedDomains : [{ id: canocalizeEntityName(hostname), name: hostname, primary: true }],
    external: externalDomains,
    hostname,
  }
}

const findingsFromNotification = (data?: DomainScanNotificationData): Finding[] => {
  const items = [...(data?.findings?.risks || []), ...(data?.findings?.security_violations || [])]

  if (items.length === 0) return []

  return items.map((finding, index) => ({
    id: canocalizeEntityName(finding.id || finding.title || finding.name || `finding-${index + 1}`),
    title: finding.title || finding.name || `Finding ${index + 1}`,
    description: finding.description || finding.summary || finding.details,
    severity: finding.severity,
    rawPayload: finding,
  }))
}

const severityToSecurityLevel = (severity?: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return FindingSecurityLevel.CRITICAL
    case 'high':
      return FindingSecurityLevel.HIGH
    case 'medium':
      return FindingSecurityLevel.MEDIUM
    case 'low':
      return FindingSecurityLevel.LOW
    default:
      return undefined
  }
}

const SectionCard = ({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) => (
  <Card>
    <CardTitle>{title}</CardTitle>
    {description ? <CardDescription>{description}</CardDescription> : null}
    <Separator separatorClass="bg-border" />
    <CardContent className="p-0">{children}</CardContent>
    {footer ? (
      <>
        <Separator separatorClass="bg-border" />
        <CardFooter className="pt-6">{footer}</CardFooter>
      </>
    ) : null}
  </Card>
)

const SelectionRow = ({
  checked,
  onCheckedChange,
  disabled,
  title,
  description,
  meta,
  badges,
  trailing,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  title: string
  description?: string
  meta?: string
  badges?: string[]
  trailing?: React.ReactNode
}) => (
  <div className={`flex items-start gap-4 px-6 py-4 ${disabled ? 'opacity-60' : ''}`}>
    <div className="pt-1">
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onCheckedChange(value === true)} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base font-semibold">{title}</p>
        {badges?.map((badge) => (
          <Badge key={badge} variant="outline">
            {badge}
          </Badge>
        ))}
      </div>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
    <div className="shrink-0 text-sm text-muted-foreground">{trailing ?? meta}</div>
  </div>
)

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="px-6 py-4">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 text-base">{value}</p>
  </div>
)

const EmptyState = ({ message }: { message: string }) => (
  <div className="px-6 py-8">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
)

const toggleSetValue = (setState: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })
}

const checkSetsUnion = (left: Set<string>, right: Set<string>) => {
  if (left.size !== right.size) return false

  for (const value of left) {
    if (!right.has(value)) return false
  }

  return true
}

const VendorsStep = ({
  vendors,
  selected,
  setSelected,
  existingIds,
}: {
  vendors: Vendor[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  existingIds: Set<string>
}) => (
  <SectionCard title="Review vendors" description="Grouped from detected technologies">
    {vendors.length === 0 ? (
      <EmptyState message="No vendors were detected in this notification." />
    ) : (
      vendors.map((vendor, index) => (
        <React.Fragment key={vendor.id}>
          <SelectionRow
            checked={existingIds.has(vendor.id) || selected.has(vendor.id)}
            onCheckedChange={() => toggleSetValue(setSelected, vendor.id)}
            disabled={existingIds.has(vendor.id)}
            title={vendor.name}
            badges={vendor.tags}
            description={vendor.description}
            trailing={existingIds.has(vendor.id) ? <Badge variant="secondary">Already added</Badge> : vendor.confidence}
          />
          {index < vendors.length - 1 ? <Separator separatorClass="bg-border" /> : null}
        </React.Fragment>
      ))
    )}
  </SectionCard>
)

const AssetsStep = ({
  owned,
  external,
  selected,
  setSelected,
  existingIds,
}: {
  owned: DomainItem[]
  external: DomainItem[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  existingIds: Set<string>
}) => {
  const selectedExternalCount = external.filter((item) => selected.has(item.id)).length

  return (
    <div className="space-y-6">
      <SectionCard title="Owned domains">
        {owned.length === 0 ? (
          <EmptyState message="No owned domains were detected in this notification." />
        ) : (
          owned.map((domain, index) => (
            <React.Fragment key={domain.id}>
              <SelectionRow
                checked={existingIds.has(domain.id) || selected.has(domain.id)}
                onCheckedChange={() => toggleSetValue(setSelected, domain.id)}
                disabled={existingIds.has(domain.id)}
                title={domain.name}
                trailing={existingIds.has(domain.id) ? <Badge variant="secondary">Already added</Badge> : domain.primary ? <Badge variant="secondary">Primary</Badge> : undefined}
              />
              {index < owned.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="External domains"
        description="Optional related domains detected during the scan"
        footer={<p className="text-sm text-muted-foreground">{selectedExternalCount} external domains selected.</p>}
      >
        {external.length === 0 ? (
          <EmptyState message="No external domains were detected in this notification." />
        ) : (
          external.map((domain, index) => (
            <React.Fragment key={domain.id}>
              <SelectionRow
                checked={existingIds.has(domain.id) || selected.has(domain.id)}
                onCheckedChange={() => toggleSetValue(setSelected, domain.id)}
                disabled={existingIds.has(domain.id)}
                title={domain.name}
                trailing={existingIds.has(domain.id) ? <Badge variant="secondary">Already added</Badge> : undefined}
              />
              {index < external.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))
        )}
      </SectionCard>
    </div>
  )
}

const FindingsStep = ({ findings, selected, setSelected }: { findings: Finding[]; selected: Set<string>; setSelected: React.Dispatch<React.SetStateAction<Set<string>>> }) => (
  <SectionCard title="Review findings" description="Optional security observations detected">
    {findings.length === 0 ? (
      <EmptyState message="No findings were included in this notification." />
    ) : (
      findings.map((finding, index) => (
        <React.Fragment key={finding.id}>
          <SelectionRow
            checked={selected.has(finding.id)}
            onCheckedChange={() => toggleSetValue(setSelected, finding.id)}
            title={finding.title}
            description={finding.description}
            meta={finding.severity}
          />
          {index < findings.length - 1 ? <Separator separatorClass="bg-border" /> : null}
        </React.Fragment>
      ))
    )}
  </SectionCard>
)

const ConfirmStep = ({ vendors, domains, findings }: { vendors: string[]; domains: string[]; findings: string[] }) => (
  <SectionCard title="Confirm import" description="Review the selected objects before importing them into Openlane.">
    <SummaryRow label="Vendors" value={vendors.length > 0 ? vendors.join(', ') : 'None selected'} />
    <Separator separatorClass="bg-border" />
    <SummaryRow label="Assets" value={domains.length > 0 ? domains.join(', ') : 'None selected'} />
    <Separator separatorClass="bg-border" />
    <SummaryRow label="Findings" value={findings.length > 0 ? findings.join(', ') : 'None selected'} />
  </SectionCard>
)

export default function DomainDiscoveryImportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { notifications } = useNotificationsContext()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkEntity, isPending: isCreatingVendors } = useCreateBulkEntity()
  const { mutateAsync: createBulkAsset, isPending: isCreatingAssets } = useCreateBulkAsset()
  const { mutateAsync: createBulkFinding, isPending: isCreatingFindings } = useCreateBulkFinding()
  const stepper = useStepper()
  const notificationId = searchParams.get('id')
  const matchedNotification = notifications.find((notification) => notification.id === notificationId)
  const notificationData = matchedNotification?.data as DomainScanNotificationData | undefined

  const vendors = useMemo(() => vendorsFromNotification(notificationData), [notificationData])
  const domains = useMemo(() => domainsFromNotification(notificationData), [notificationData])
  const findings = useMemo(() => findingsFromNotification(notificationData), [notificationData])
  const vendorLookupNames = useMemo(() => Array.from(new Set(vendors.flatMap((vendor) => [vendor.name, sanitizeEntityName(vendor.name)]).filter(Boolean))), [vendors])
  const assetLookupNames = useMemo(() => Array.from(new Set([...domains.owned, ...domains.external].map((domain) => domain.name).filter(Boolean))), [domains])

  // fetch existing domains and entities to make sure users do not try to bulk import existing ones which
  // would lead to another failure ( duplicates )
  const { vendorNodes } = useVendorsWithFilter({
    where:
      vendorLookupNames.length > 0
        ? {
            or: [{ displayNameIn: vendorLookupNames }, { nameIn: vendorLookupNames }],
          }
        : undefined,
    enabled: vendorLookupNames.length > 0,
  })

  const { assetsNodes } = useAssetsWithFilter({
    where:
      assetLookupNames.length > 0
        ? {
            or: [{ identifierIn: assetLookupNames }, { displayNameIn: assetLookupNames }, { nameIn: assetLookupNames }],
          }
        : undefined,
    enabled: assetLookupNames.length > 0,
  })

  const existingVendorLookup = useMemo(() => {
    const values = new Set<string>()
    vendorNodes.forEach((vendor) => {
      values.add(canocalizeLookupValue(vendor.displayName))
      values.add(canocalizeLookupValue(vendor.name))
    })
    values.delete('')
    return values
  }, [vendorNodes])

  const existingAssetLookup = useMemo(() => {
    const values = new Set<string>()
    assetsNodes.forEach((asset) => {
      values.add(canocalizeLookupValue(asset.identifier))
      values.add(canocalizeLookupValue(asset.displayName))
      values.add(canocalizeLookupValue(asset.name))
    })
    values.delete('')
    return values
  }, [assetsNodes])

  const existingVendorIds = useMemo(
    () =>
      new Set(
        vendors
          .filter((vendor) => existingVendorLookup.has(canocalizeLookupValue(vendor.name)) || existingVendorLookup.has(canocalizeLookupValue(sanitizeEntityName(vendor.name))))
          .map((vendor) => vendor.id),
      ),
    [existingVendorLookup, vendors],
  )

  const allDomains = useMemo(() => [...domains.owned, ...domains.external], [domains])
  const selectionSeedKey = useMemo(
    () =>
      [
        matchedNotification?.id || notificationId || '',
        vendors.map((vendor) => vendor.id).join(','),
        domains.owned.map((domain) => domain.id).join(','),
        domains.external.map((domain) => domain.id).join(','),
        findings.map((finding) => finding.id).join(','),
      ].join('|'),
    [domains.external, domains.owned, findings, matchedNotification?.id, notificationId, vendors],
  )
  const initializedSelectionKeyRef = useRef('')

  const existingAssetIds = useMemo(
    () => new Set(allDomains.filter((domain) => existingAssetLookup.has(canocalizeLookupValue(domain.name))).map((domain) => domain.id)),
    [allDomains, existingAssetLookup],
  )

  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(() => new Set())
  const [selectedDomainIds, setSelectedDomainIds] = useState<Set<string>>(() => new Set())
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(() => new Set(findings.map((finding) => finding.id)))

  useEffect(() => {
    if (!selectionSeedKey || initializedSelectionKeyRef.current === selectionSeedKey) {
      return
    }

    initializedSelectionKeyRef.current = selectionSeedKey
    setSelectedVendorIds(new Set(vendors.map((vendor) => vendor.id)))
    setSelectedDomainIds(new Set(domains.owned.map((domain) => domain.id)))
    setSelectedFindingIds(new Set(findings.map((finding) => finding.id)))
  }, [domains.owned, findings, selectionSeedKey, vendors])

  useEffect(() => {
    setSelectedVendorIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => !existingVendorIds.has(id)))
      return checkSetsUnion(prev, next) ? prev : next
    })
  }, [existingVendorIds])

  useEffect(() => {
    setSelectedDomainIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => !existingAssetIds.has(id)))
      return checkSetsUnion(prev, next) ? prev : next
    })
  }, [existingAssetIds])

  const selectedVendors = useMemo(() => vendors.filter((vendor) => selectedVendorIds.has(vendor.id)).map((vendor) => vendor.name), [selectedVendorIds, vendors])
  const selectedDomains = useMemo(() => allDomains.filter((domain) => selectedDomainIds.has(domain.id)).map((domain) => domain.name), [allDomains, selectedDomainIds])
  const selectedFindings = useMemo(() => findings.filter((finding) => selectedFindingIds.has(finding.id)).map((finding) => finding.title), [selectedFindingIds, findings])
  const selectedVendorObjects = useMemo(() => vendors.filter((vendor) => selectedVendorIds.has(vendor.id) && !existingVendorIds.has(vendor.id)), [existingVendorIds, selectedVendorIds, vendors])
  const selectedDomainObjects = useMemo(() => allDomains.filter((domain) => selectedDomainIds.has(domain.id) && !existingAssetIds.has(domain.id)), [allDomains, existingAssetIds, selectedDomainIds])
  const selectedFindingObjects = useMemo(() => findings.filter((finding) => selectedFindingIds.has(finding.id)), [selectedFindingIds, findings])
  const isImporting = isCreatingVendors || isCreatingAssets || isCreatingFindings
  const hasImportableSelections = selectedVendorObjects.length > 0 || selectedDomainObjects.length > 0 || selectedFindingObjects.length > 0

  const handleImport = async () => {
    if (!notificationData) {
      errorNotification({
        title: 'Domain scan import unavailable',
        description: 'This domain import is currently unavailable. Please refresh the page to recheck the notification',
      })
      return
    }

    const vendorInputs: CreateEntityInput[] = selectedVendorObjects.map((vendor) => ({
      name: sanitizeEntityName(vendor.name),
      displayName: vendor.name,
      description: vendor.description,
      links: vendor.description ? [vendor.description] : undefined,
      providedServices: vendor.tags.length > 0 ? vendor.tags : undefined,
      vendorMetadata: {
        source: 'domain_scan',
        scan_id: notificationData.scan_id,
        detected_url: notificationData.url,
      },
    }))

    const assetInputs: CreateAssetInput[] = selectedDomainObjects.map((domain) => ({
      name: domain.name,
      displayName: domain.name,
      identifier: domain.name,
      assetType: AssetAssetType.DOMAIN,
      sourceType: AssetSourceType.DISCOVERED,
      website: domain.primary && notificationData.url ? notificationData.url : undefined,
      tags: domain.primary ? ['primary-domain'] : undefined,
    }))

    const findingInputs: CreateFindingInput[] = selectedFindingObjects.map((finding) => ({
      displayName: finding.title,
      description: finding.description,
      source: 'Domain Scan',
      open: true,
      externalURI: notificationData.url,
      assessmentID: notificationData.scan_id,
      findingClass: 'DOMAIN_SCAN',
      securityLevel: severityToSecurityLevel(finding.severity),
      severity: finding.severity,
      rawPayload: finding.rawPayload,
      metadata: {
        notification_id: matchedNotification?.id,
        scan_id: notificationData.scan_id,
      },
    }))

    try {
      await Promise.all([
        vendorInputs.length > 0 ? createBulkEntity({ input: vendorInputs, entityTypeName: 'vendor' }) : Promise.resolve(null),
        assetInputs.length > 0 ? createBulkAsset({ input: assetInputs }) : Promise.resolve(null),
        findingInputs.length > 0 ? createBulkFinding({ input: findingInputs }) : Promise.resolve(null),
      ])

      successNotification({
        title: 'Bulk import completed',
        description: `Created ${vendorInputs.length} vendors, ${assetInputs.length} assets, and ${findingInputs.length} findings.`,
      })
      router.push('/notifications')
    } catch (error) {
      errorNotification({
        title: 'Import failed',
        description: parseErrorMessage(error),
      })
    }
  }

  const handleNextButton = () => {
    if (!stepper.isLast) {
      stepper.next()
      return
    }

    void handleImport()
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      return
    }

    stepper.prev()
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <PageHeading eyebrow="Exposure" heading="Domain scan import" />
      <p className="mt-2 text-sm text-muted-foreground">Review the scanned output for `{domains.hostname}` and choose what should be imported.</p>

      <div className="py-6">
        <StepHeader stepper={stepper} className="mb-6" />
        <Separator separatorClass="bg-card" />

        <div className="py-6">
          {stepper.switch({
            vendors: () => <VendorsStep vendors={vendors} selected={selectedVendorIds} setSelected={setSelectedVendorIds} existingIds={existingVendorIds} />,
            assets: () => <AssetsStep owned={domains.owned} external={domains.external} selected={selectedDomainIds} setSelected={setSelectedDomainIds} existingIds={existingAssetIds} />,
            findings: () => <FindingsStep findings={findings} selected={selectedFindingIds} setSelected={setSelectedFindingIds} />,
            confirm: () => <ConfirmStep vendors={selectedVendors} domains={selectedDomains} findings={selectedFindings} />,
          })}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => router.push('/notifications')}>
            Review later
          </Button>

          <div className="flex items-center gap-3">
            {!stepper.isFirst ? (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            ) : null}
            <Button variant="primary" onClick={handleNextButton} loading={isImporting} disabled={isImporting || (stepper.isLast && !hasImportableSelections)}>
              {stepper.isLast ? 'Import' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
