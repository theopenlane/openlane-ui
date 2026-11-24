import { useState } from 'react'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { isOneOf } from '@/utils/type-guards'
import { EXPOSURE_KINDS, type TExposureKind } from './exposure-items'

export const ALL_KINDS = 'all'
export type TExposureFilter = typeof ALL_KINDS | TExposureKind
export const EXPOSURE_FILTERS: TExposureFilter[] = [ALL_KINDS, ...EXPOSURE_KINDS]
export const isExposureFilter = isOneOf(EXPOSURE_FILTERS)

export const useExposureView = () => {
  const [kindFilter, setKindFilter] = useState<TExposureFilter>(ALL_KINDS)
  const [openOnly, setOpenOnly] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const withFirstPage =
    <TValue>(update: (value: TValue) => void) =>
    (value: TValue) => {
      update(value)
      setPagination((current) => ({ ...current, page: 1 }))
    }

  return {
    kindFilter,
    setKindFilter: withFirstPage(setKindFilter),
    openOnly,
    setOpenOnly: withFirstPage(setOpenOnly),
    searchText,
    setSearchText: withFirstPage(setSearchText),
    pagination,
    setPagination,
  }
}

export type TExposureView = ReturnType<typeof useExposureView>
