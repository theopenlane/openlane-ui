import type { GraphQLClient } from 'graphql-request'
import { chunk } from '@/utils/async'
import { type ReportScanExistingIds } from '@/lib/graphql-hooks/report-scan'
import {
  MappedControlMappingSource,
  type CreateAssetInput,
  type CreateBulkAssetMutation,
  type CreateBulkControlMutation,
  type CreateBulkEntityMutation,
  type CreateBulkFindingControlMutation,
  type CreateBulkFindingMutation,
  type CreateBulkGroupMutation,
  type CreateBulkMappedControlMutation,
  type CreateBulkPlatformMutation,
  type CreateBulkReviewMutation,
  type CreateBulkSystemDetailMutation,
  type CreateControlInput,
  type CreateEntityInput,
  type CreateFindingInput,
  type CreateGroupInput,
  type CreatePlatformInput,
  type CreateProgramWithMembersInput,
  type CreateProgramWithMembersMutation,
  type CreateReviewInput,
  type CreateSystemDetailInput,
  type UpdatePlatformMutation,
} from '@repo/codegen/src/schema'
import { CREATE_BULK_ENTITY } from '@repo/codegen/query/entity'
import { CREATE_BULK_ASSET } from '@repo/codegen/query/asset'
import { CREATE_BULK_PLATFORM, UPDATE_PLATFORM } from '@repo/codegen/query/platform'
import { CREATE_BULK_SYSTEM_DETAIL } from '@repo/codegen/query/system-detail'
import { CREATE_BULK_GROUP } from '@repo/codegen/query/group'
import { CREATE_BULK_CONTROL } from '@repo/codegen/query/control'
import { CREATE_BULK_REVIEW } from '@repo/codegen/query/review'
import { CREATE_BULK_FINDING } from '@repo/codegen/query/finding'
import { CREATE_BULK_FINDING_CONTROL } from '@repo/codegen/query/finding-control'
import { CREATE_BULK_MAPPED_CONTROL } from '@repo/codegen/query/mapped-control'
import { CREATE_PROGRAM_WITH_MEMBERS } from '@repo/codegen/query/program'

const BULK_CREATE_BATCH_SIZE = 100

type PlannedItem<TInput> = { ref: string; input: TInput }

export type ReportScanImportPlan = {
  existing: ReportScanExistingIds
  program?: CreateProgramWithMembersInput
  programControlRefs: string[]
  vendors: PlannedItem<CreateEntityInput>[]
  assets: (PlannedItem<CreateAssetInput> & { vendorRef?: string })[]
  platforms: (PlannedItem<CreatePlatformInput> & { vendorRefs: string[]; assetRefs: string[] })[]
  existingPlatformLinks: { ref: string; vendorRefs: string[]; assetRefs: string[] }[]
  systems: (PlannedItem<CreateSystemDetailInput> & { platformRef?: string })[]
  groups: PlannedItem<CreateGroupInput>[]
  controls: PlannedItem<CreateControlInput>[]
  controlMappings: { ref: string; toControlRefCodes: string[] }[]
  reviews: (PlannedItem<CreateReviewInput> & { controlRefs: string[] })[]
  findings: (PlannedItem<CreateFindingInput> & { controlRefs: string[] })[]
}

export type ReportScanCreatedSection = 'vendors' | 'assets' | 'platforms' | 'systems' | 'groups' | 'controls' | 'reviews' | 'findings'

export type ReportScanImportProgress = {
  created: Record<ReportScanCreatedSection, Record<string, string>>
  linkedPlatforms: string[]
  linkedFindings: string[]
  mappedControls: string[]
  programId?: string
}

export const emptyImportProgress = (): ReportScanImportProgress => ({
  created: { vendors: {}, assets: {}, platforms: {}, systems: {}, groups: {}, controls: {}, reviews: {}, findings: {} },
  linkedPlatforms: [],
  linkedFindings: [],
  mappedControls: [],
})

export class ReportScanImportError extends Error {
  constructor(
    readonly stage: string,
    readonly progress: ReportScanImportProgress,
    cause: unknown,
  ) {
    super(`Report import failed while creating ${stage}`, { cause })
  }
}

const idsOf = (nodes?: { id: string }[] | null) => (nodes ?? []).map((node) => node.id)

const resolveRefs = (refs: string[], known: Record<string, string>) => [...new Set(refs.map((ref) => known[ref]).filter((id): id is string => !!id))]

export const runReportScanImport = async (client: GraphQLClient, plan: ReportScanImportPlan, progress: ReportScanImportProgress, onProgress: () => void): Promise<ReportScanImportProgress> => {
  const known = (section: 'vendors' | 'assets' | 'platforms' | 'controls') => ({ ...plan.existing[section], ...progress.created[section] })
  let stage = 'vendors'

  const createSection = async <TItem extends { ref: string }, TInput>(
    section: ReportScanCreatedSection,
    items: TItem[],
    toInput: (item: TItem) => TInput,
    create: (input: TInput[]) => Promise<string[]>,
  ) => {
    const pending = items.filter((item) => !progress.created[section][item.ref])
    for (const batch of chunk(pending, BULK_CREATE_BATCH_SIZE)) {
      const ids = await create(batch.map(toInput))
      if (ids.length !== batch.length) throw new Error(`Expected ${batch.length} ${section} to be created, received ${ids.length}`)
      batch.forEach((item, index) => (progress.created[section][item.ref] = ids[index]))
      onProgress()
    }
  }

  try {
    await createSection(
      'vendors',
      plan.vendors,
      (vendor) => vendor.input,
      async (input) => idsOf((await client.request<CreateBulkEntityMutation>(CREATE_BULK_ENTITY, { input, entityTypeName: 'vendor' })).createBulkEntity.entities),
    )

    stage = 'assets'
    await createSection(
      'assets',
      plan.assets,
      (asset) => ({ ...asset.input, entityIDs: resolveRefs(asset.vendorRef ? [asset.vendorRef] : [], known('vendors')) }),
      async (input) => idsOf((await client.request<CreateBulkAssetMutation>(CREATE_BULK_ASSET, { input })).createBulkAsset.assets),
    )

    stage = 'platforms'
    await createSection(
      'platforms',
      plan.platforms,
      (platform) => ({ ...platform.input, entityIDs: resolveRefs(platform.vendorRefs, known('vendors')), assetIDs: resolveRefs(platform.assetRefs, known('assets')) }),
      async (input) => idsOf((await client.request<CreateBulkPlatformMutation>(CREATE_BULK_PLATFORM, { input })).createBulkPlatform.platforms),
    )

    for (const link of plan.existingPlatformLinks.filter((link) => !progress.linkedPlatforms.includes(link.ref))) {
      await client.request<UpdatePlatformMutation>(UPDATE_PLATFORM, {
        updatePlatformId: plan.existing.platforms[link.ref],
        input: { addEntityIDs: resolveRefs(link.vendorRefs, known('vendors')), addAssetIDs: resolveRefs(link.assetRefs, known('assets')) },
      })
      progress.linkedPlatforms.push(link.ref)
      onProgress()
    }

    stage = 'system details'
    await createSection(
      'systems',
      plan.systems,
      (system) => ({ ...system.input, platformIDs: resolveRefs(system.platformRef ? [system.platformRef] : [], known('platforms')) }),
      async (input) => idsOf((await client.request<CreateBulkSystemDetailMutation>(CREATE_BULK_SYSTEM_DETAIL, { input })).createBulkSystemDetail.systemDetails),
    )

    stage = 'groups'
    await createSection(
      'groups',
      plan.groups,
      (group) => group.input,
      async (input) => idsOf((await client.request<CreateBulkGroupMutation>(CREATE_BULK_GROUP, { input })).createBulkGroup.groups),
    )

    stage = 'controls'
    await createSection(
      'controls',
      plan.controls,
      (control) => control.input,
      async (input) => idsOf((await client.request<CreateBulkControlMutation>(CREATE_BULK_CONTROL, { input })).createBulkControl.controls),
    )

    stage = 'reviews'
    await createSection(
      'reviews',
      plan.reviews,
      (review) => ({ ...review.input, controlIDs: resolveRefs(review.controlRefs, known('controls')) }),
      async (input) => idsOf((await client.request<CreateBulkReviewMutation>(CREATE_BULK_REVIEW, { input })).createBulkReview.reviews),
    )

    stage = 'findings'
    await createSection(
      'findings',
      plan.findings,
      (finding) => finding.input,
      async (input) => idsOf((await client.request<CreateBulkFindingMutation>(CREATE_BULK_FINDING, { input })).createBulkFinding.findings),
    )

    stage = 'finding controls'
    for (const batch of chunk(
      plan.findings.filter((finding) => !progress.linkedFindings.includes(finding.ref)),
      BULK_CREATE_BATCH_SIZE,
    )) {
      const input = batch.flatMap((finding) => resolveRefs(finding.controlRefs, known('controls')).map((controlID) => ({ findingID: progress.created.findings[finding.ref], controlID })))
      if (input.length > 0) await client.request<CreateBulkFindingControlMutation>(CREATE_BULK_FINDING_CONTROL, { input })
      progress.linkedFindings.push(...batch.map((finding) => finding.ref))
      onProgress()
    }

    stage = 'the program'
    if (plan.program && !progress.programId) {
      const programLinks = {
        controlIDs: resolveRefs(plan.programControlRefs, known('controls')),
        systemDetailIDs: Object.values(progress.created.systems),
        reviewIDs: Object.values(progress.created.reviews),
        findingIDs: Object.values(progress.created.findings),
      }
      const response = await client.request<CreateProgramWithMembersMutation>(CREATE_PROGRAM_WITH_MEMBERS, { input: { ...plan.program, program: { ...plan.program.program, ...programLinks } } })
      progress.programId = response.createProgramWithMembers.program.id
      onProgress()
    }

    stage = 'control mappings'
    for (const batch of chunk(
      plan.controlMappings.filter((mapping) => !progress.mappedControls.includes(mapping.ref)),
      BULK_CREATE_BATCH_SIZE,
    )) {
      const input = batch.flatMap((mapping) =>
        resolveRefs([mapping.ref], known('controls')).map((controlID) => ({ fromControlIDs: [controlID], toControlRefCodes: mapping.toControlRefCodes, source: MappedControlMappingSource.IMPORTED })),
      )
      if (input.length > 0) await client.request<CreateBulkMappedControlMutation>(CREATE_BULK_MAPPED_CONTROL, { input })
      progress.mappedControls.push(...batch.map((mapping) => mapping.ref))
      onProgress()
    }

    return progress
  } catch (error) {
    throw new ReportScanImportError(stage, progress, error)
  }
}
