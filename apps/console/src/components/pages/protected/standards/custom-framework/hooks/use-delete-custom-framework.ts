import { useState } from 'react'
import { useBulkEditControl, useControlIdFetcher } from '@/lib/graphql-hooks/control'
import { useDeleteStandard } from '@/lib/graphql-hooks/standard'
import { chunk } from '@/utils/async'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'

const UNLINK_BATCH_SIZE = 100

export const useDeleteCustomFramework = () => {
  const fetchControlIds = useControlIdFetcher()
  const { mutateAsync: bulkEditControls } = useBulkEditControl()
  const { mutateAsync: deleteStandard } = useDeleteStandard()
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteFramework = async (standardId: string) => {
    setIsDeleting(true)
    try {
      const controlIds = await fetchControlIds({ standardID: standardId })

      for (const ids of chunk(controlIds, UNLINK_BATCH_SIZE)) {
        const { updateBulkControl } = await bulkEditControls({ ids, input: { clearStandard: true } })
        if (updateBulkControl.notUpdatedIDs.length) {
          throw new UserFacingError(`${pluralizeWithCount(updateBulkControl.notUpdatedIDs.length, 'control')} could not be unlinked, so the framework was not deleted.`)
        }
      }

      await deleteStandard({ deleteStandardId: standardId })
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteFramework, isDeleting }
}
