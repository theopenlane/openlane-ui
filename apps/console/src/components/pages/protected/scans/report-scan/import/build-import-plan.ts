import { AssetAssetType, AssetSourceType, ControlControlSource, PlatformSourceType } from '@repo/codegen/src/schema'
import { existingNameKey, type ReportScanExistingIds } from '@/lib/graphql-hooks/report-scan'
import { SOC_2_SYSTEM_STANDARD } from '@/constants/standards'
import { SOC_2_FRAMEWORK_NAME, trustServicesCategoryForCriteria } from '@/constants/trust-services-categories'
import { toApiDateTime } from '@/utils/date'
import type { ParsedReport, ReportPlatformOverrides, ReportProgramChoice, ReportSelection, ReportSystemOverrides } from '../types'
import { resolvePlatform, resolveSystem, selectedItems } from '../selection'
import type { ReportScanImportPlan } from './run-report-import'

const FINDING_DISPLAY_NAME_LENGTH = 120

const nonEmpty = (value?: string) => (value && value.trim() ? value.trim() : undefined)

const assetTypeOf = (value?: string): AssetAssetType | undefined => Object.values(AssetAssetType).find((type) => type === value?.toUpperCase())

const findingDisplayName = (description: string) => (description.length > FINDING_DISPLAY_NAME_LENGTH ? `${description.slice(0, FINDING_DISPLAY_NAME_LENGTH - 1).trimEnd()}…` : description)

type BuildImportPlanArgs = {
  report: ParsedReport
  scanId: string
  selection: ReportSelection
  platformOverrides: ReportPlatformOverrides
  systemOverrides: ReportSystemOverrides
  program: ReportProgramChoice
  programName: string
  soc2StandardId?: string
  existing: ReportScanExistingIds
}

export const buildImportPlan = ({ report, scanId, selection, platformOverrides, systemOverrides, program, programName, soc2StandardId, existing }: BuildImportPlanArgs): ReportScanImportPlan => {
  const scanIDs = [scanId]
  const selected = selectedItems(report, selection)

  const platforms = selected.platforms.map((platform) => {
    const resolved = resolvePlatform(platform, platformOverrides)
    const name = resolved.name.trim()
    return { ...resolved, name, ref: existingNameKey(name) }
  })
  const platformRefById = new Map(platforms.map((platform) => [platform.id, platform.ref]))
  const vendorRefs = selected.vendors.map((vendor) => existingNameKey(vendor.name))
  const vendorRefById = new Map(report.vendors.map((vendor) => [vendor.id, existingNameKey(vendor.name)]))
  const vendorRefOf = (vendorId?: string) => (vendorId ? vendorRefById.get(vendorId) : undefined)
  const assetRefs = selected.assets.map((asset) => existingNameKey(asset.name))
  const selectedControlRefs = new Set(selected.controls.map((control) => control.refCode))
  const selectedRefCodes = (refCodes: string[]) => refCodes.filter((refCode) => selectedControlRefs.has(refCode))
  const clonesStandard = program.create && !!soc2StandardId
  const newControls = selected.controls.filter((control) => !existing.controls[control.refCode])

  return {
    existing,
    program: program.create
      ? {
          program: {
            name: report.program?.name ?? programName,
            description: report.program?.description,
            frameworkName: SOC_2_FRAMEWORK_NAME,
            auditFirm: report.program?.auditFirm,
            auditor: report.program?.auditor,
            auditorEmail: report.program?.auditorEmail,
          },
          standardID: soc2StandardId,
          categories: clonesStandard ? [...program.categories] : undefined,
        }
      : undefined,
    programControlRefs: [...selectedControlRefs],
    vendors: selected.vendors
      .filter((vendor) => !existing.vendors[existingNameKey(vendor.name)])
      .map((vendor) => ({
        ref: existingNameKey(vendor.name),
        input: {
          name: vendor.name,
          displayName: vendor.displayName,
          description: vendor.description,
          domains: vendor.domains.length > 0 ? vendor.domains : undefined,
          providedServices: vendor.providedServices.length > 0 ? vendor.providedServices : undefined,
          hasSoc2: vendor.hasSoc2,
          ssoEnforced: vendor.ssoEnforced,
          mfaSupported: vendor.mfaSupported,
          mfaEnforced: vendor.mfaEnforced,
          statusPageURL: vendor.statusPageURL,
          scanIDs,
        },
      })),
    assets: selected.assets
      .filter((asset) => !existing.assets[existingNameKey(asset.name)])
      .map((asset) => ({
        ref: existingNameKey(asset.name),
        vendorRef: vendorRefOf(asset.vendorId),
        input: {
          name: asset.name,
          displayName: asset.displayName,
          description: asset.description,
          assetType: assetTypeOf(asset.assetType),
          containsPii: asset.containsPii,
          physicalLocation: asset.physicalLocation,
          region: asset.region,
          categories: asset.categories.length > 0 ? asset.categories : undefined,
          sourceType: AssetSourceType.IMPORTED,
          scanIDs,
        },
      })),
    platforms: platforms
      .filter((platform) => platform.name && !existing.platforms[platform.ref])
      .map((platform) => ({
        ref: platform.ref,
        vendorRefs,
        assetRefs,
        input: {
          name: platform.name,
          description: nonEmpty(platform.description),
          businessPurpose: nonEmpty(platform.businessPurpose),
          environmentName: nonEmpty(platform.environmentName),
          scopeName: nonEmpty(platform.scopeName),
          region: nonEmpty(platform.region),
          physicalLocation: nonEmpty(platform.physicalLocation),
          containsPii: platform.containsPii,
          sourceType: PlatformSourceType.IMPORTED,
          scanIDs,
        },
      })),
    existingPlatformLinks: platforms.filter((platform) => platform.name && existing.platforms[platform.ref]).map((platform) => ({ ref: platform.ref, vendorRefs, assetRefs })),
    systems: selected.systems
      .map((system) => resolveSystem(system, systemOverrides))
      .filter((system) => system.name.trim())
      .map((system) => ({
        ref: system.id,
        platformRef: (system.platformId && platformRefById.get(system.platformId)) || platforms[0]?.ref,
        input: { systemName: system.name.trim(), description: nonEmpty(system.description) },
      })),
    groups: selected.groups
      .filter((group) => !existing.groups[existingNameKey(group.name)])
      .map((group) => ({ ref: group.id, input: { name: group.name, displayName: group.displayName, description: group.description } })),
    controls: newControls.map((control) => ({
      ref: control.refCode,
      input: {
        refCode: control.refCode,
        title: control.title,
        description: control.description,
        auditorReferenceID: control.auditorReferenceID,
        category: control.category,
        subcategory: control.subcategory,
        source: ControlControlSource.IMPORTED,
        scanIDs,
      },
    })),
    controlMappings: clonesStandard
      ? newControls
          .map((control) => ({
            ref: control.refCode,
            toControlRefCodes: control.criteria
              .filter((criteria) => {
                const category = trustServicesCategoryForCriteria(criteria)
                return !!category && program.categories.has(category)
              })
              .map((criteria) => `${SOC_2_SYSTEM_STANDARD.shortName}::${criteria}`),
          }))
          .filter((mapping) => mapping.toControlRefCodes.length > 0)
      : [],
    reviews: selected.reviews.map((review) => ({
      ref: review.id,
      controlRefs: selectedRefCodes(review.refCodes),
      input: {
        title: review.title,
        summary: review.summary,
        details: review.details,
        reporter: review.reporter,
        source: review.source,
        externalID: review.externalID,
        approved: review.approved,
        reportedAt: toApiDateTime(review.reportedAt),
        reviewedAt: toApiDateTime(review.reviewedAt),
        approvedAt: toApiDateTime(review.approvedAt),
      },
    })),
    findings: selected.findings.map((finding) => ({
      ref: finding.id,
      controlRefs: selectedRefCodes(finding.refCodes),
      reviewRef: finding.reviewId,
      input: {
        displayName: findingDisplayName(finding.description),
        description: finding.description,
        severity: finding.severity,
        open: finding.open,
        source: finding.source,
        reportedAt: toApiDateTime(finding.reportedAt),
        scanIDs,
      },
    })),
  }
}
