import React from 'react'
import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FeatureGate } from '@/lib/subscription-plan/feature-gate'
import { ImportRunner } from '@/components/pages/protected/import/import-runner'
import { IMPORT_TYPE_PARAM, IMPORT_VENDOR_PARAM, resolveImportTarget } from '@/components/shared/record-import/lib/import-routes'

type TImportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const firstValue = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value) || undefined

const readImportTarget = async (searchParams: TImportPageProps['searchParams']) => {
  const params = await searchParams
  return resolveImportTarget(firstValue(params[IMPORT_TYPE_PARAM]), firstValue(params[IMPORT_VENDOR_PARAM]))
}

export const generateMetadata = async ({ searchParams }: TImportPageProps): Promise<Metadata> => ({ title: (await readImportTarget(searchParams))?.title ?? 'Import' })

const Page = async ({ searchParams }: TImportPageProps) => {
  const target = await readImportTarget(searchParams)
  if (!target) notFound()

  return (
    <FeatureGate objectType={target.gate}>
      <ImportRunner entityType={target.entityType} vendorId={target.vendorId} />
    </FeatureGate>
  )
}

export default Page
