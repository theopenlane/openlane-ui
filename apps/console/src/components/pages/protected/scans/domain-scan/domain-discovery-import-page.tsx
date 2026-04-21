'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

const normalizeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const getHostnameFromUrl = (value?: string) => {
  if (!value) return unknownDomain

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return (
      value
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        ?.toLowerCase() || unknownDomain
    )
  }
}

const deriveVendors = (data?: DomainScanNotificationData): Vendor[] => {
  const vendors = data?.vendors
  if (!vendors || vendors.length === 0) return []

  return vendors.map((vendor) => ({
    id: normalizeId(vendor.name || vendor.url || 'vendor'),
    name: vendor.name || 'Unknown vendor',
    tags: vendor.categories?.length ? vendor.categories : [],
    description: vendor.url,
  }))
}

const deriveDomains = (data?: DomainScanNotificationData) => {
  const hostname = getHostnameFromUrl(data?.url)
  const domains = Array.from(new Set((data?.assets?.dns_records || []).map((record) => record.domain?.toLowerCase()).filter(Boolean as unknown as (value: string | undefined) => value is string)))

  if (domains.length === 0) {
    return {
      owned: hostname === unknownDomain ? [] : [{ id: normalizeId(hostname), name: hostname, primary: true }],
      external: [],
      hostname,
    }
  }

  const owned = domains.filter((domain) => domain === hostname || domain.endsWith(`.${hostname}`)).map((domain) => ({ id: normalizeId(domain), name: domain, primary: domain === hostname }))
  const external = domains.filter((domain) => !owned.some((item) => item.name === domain)).map((domain) => ({ id: normalizeId(domain), name: domain }))

  return {
    owned: owned.length > 0 ? owned : [{ id: normalizeId(hostname), name: hostname, primary: true }],
    external,
    hostname,
  }
}

const deriveFindings = (data?: DomainScanNotificationData): Finding[] => {
  const items = [...(data?.findings?.risks || []), ...(data?.findings?.security_violations || [])]
  if (items.length === 0) return []

  return items.map((finding, index) => ({
    id: normalizeId(finding.id || finding.title || finding.name || `finding-${index + 1}`),
    title: finding.title || finding.name || `Finding ${index + 1}`,
    description: finding.description || finding.summary || finding.details,
    severity: finding.severity,
  }))
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
  title,
  description,
  meta,
  badges,
  trailing,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: string
  description?: string
  meta?: string
  badges?: string[]
  trailing?: React.ReactNode
}) => (
  <div className="flex items-start gap-4 px-6 py-4">
    <div className="pt-1">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
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

const VendorsStep = ({ vendors, selected, setSelected }: { vendors: Vendor[]; selected: Set<string>; setSelected: React.Dispatch<React.SetStateAction<Set<string>>> }) => (
  <SectionCard title="Review vendors" description="Grouped from detected technologies">
    {vendors.length === 0 ? (
      <EmptyState message="No vendors were detected in this notification." />
    ) : (
      vendors.map((vendor, index) => (
        <React.Fragment key={vendor.id}>
          <SelectionRow
            checked={selected.has(vendor.id)}
            onCheckedChange={() => toggleSetValue(setSelected, vendor.id)}
            title={vendor.name}
            badges={vendor.tags}
            description={vendor.description}
            meta={vendor.confidence}
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
}: {
  owned: DomainItem[]
  external: DomainItem[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
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
                checked={selected.has(domain.id)}
                onCheckedChange={() => toggleSetValue(setSelected, domain.id)}
                title={domain.name}
                trailing={domain.primary ? <Badge variant="secondary">Primary</Badge> : undefined}
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
              <SelectionRow checked={selected.has(domain.id)} onCheckedChange={() => toggleSetValue(setSelected, domain.id)} title={domain.name} />
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
  const stepper = useStepper()
  const notificationId = searchParams.get('id')
  const matchedNotification = notifications.find((notification) => notification.id === notificationId)
  const notificationData = matchedNotification?.data as DomainScanNotificationData | undefined

  const vendors = useMemo(() => deriveVendors(notificationData), [notificationData])
  const domains = useMemo(() => deriveDomains(notificationData), [notificationData])
  const findings = useMemo(() => deriveFindings(notificationData), [notificationData])

  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(() => new Set(vendors.map((vendor) => vendor.id)))
  const [selectedDomainIds, setSelectedDomainIds] = useState<Set<string>>(() => new Set(domains.owned.map((domain) => domain.id)))
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(() => new Set(findings.map((finding) => finding.id)))

  useEffect(() => {
    setSelectedVendorIds(new Set(vendors.map((vendor) => vendor.id)))
  }, [vendors])

  useEffect(() => {
    setSelectedDomainIds(new Set(domains.owned.map((domain) => domain.id)))
  }, [domains])

  useEffect(() => {
    setSelectedFindingIds(new Set(findings.map((finding) => finding.id)))
  }, [findings])

  const selectedVendors = useMemo(() => vendors.filter((vendor) => selectedVendorIds.has(vendor.id)).map((vendor) => vendor.name), [selectedVendorIds, vendors])
  const selectedDomains = useMemo(() => [...domains.owned, ...domains.external].filter((domain) => selectedDomainIds.has(domain.id)).map((domain) => domain.name), [selectedDomainIds, domains])
  const selectedFindings = useMemo(() => findings.filter((finding) => selectedFindingIds.has(finding.id)).map((finding) => finding.title), [selectedFindingIds, findings])

  const handleContinue = () => {
    if (stepper.isLast) {
      router.push('/notifications')
      return
    }
    stepper.next()
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
            vendors: () => <VendorsStep vendors={vendors} selected={selectedVendorIds} setSelected={setSelectedVendorIds} />,
            assets: () => <AssetsStep owned={domains.owned} external={domains.external} selected={selectedDomainIds} setSelected={setSelectedDomainIds} />,
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
            <Button variant="primary" onClick={handleContinue}>
              {stepper.isLast ? 'Import' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
