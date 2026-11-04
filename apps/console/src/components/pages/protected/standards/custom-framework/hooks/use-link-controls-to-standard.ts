import { useBulkEditControl } from '@/lib/graphql-hooks/control'

export const useLinkControlsToStandard = () => {
  const { mutateAsync, isPending } = useBulkEditControl()

  const linkControls = async (standardId: string, controlIds: string[]) => {
    const { updateBulkControl } = await mutateAsync({ ids: controlIds, input: { standardID: standardId } })
    return { linked: updateBulkControl.updatedIDs?.length ?? 0, failed: updateBulkControl.notUpdatedIDs.length, error: updateBulkControl.error }
  }

  return { linkControls, isPending }
}
