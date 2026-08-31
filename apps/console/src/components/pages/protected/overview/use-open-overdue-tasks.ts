'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saveQuickFilters } from '@/components/shared/table-filter/filter-storage.ts'
import { overdueTaskQuickFilter } from '@/components/pages/protected/tasks/util/task'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useOrganization } from '@/hooks/useOrganization'

export const useOpenOverdueTasks = () => {
  const { currentOrgId } = useOrganization()
  const router = useRouter()

  return useCallback(() => {
    saveQuickFilters(TableKeyEnum.TASK, overdueTaskQuickFilter(true), currentOrgId)
    router.push('/automation/tasks')
  }, [currentOrgId, router])
}
