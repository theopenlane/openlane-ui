import { useCallback } from 'react'
import { useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const useControlImplementationVerification = () => {
  const { mutateAsync: updateImplementation, isPending } = useUpdateControlImplementation()
  const { successNotification, errorNotification } = useNotification()

  const setVerified = useCallback(
    async (id: string, verified: boolean) => {
      try {
        await updateImplementation({ updateControlImplementationId: id, input: { verified } })
        successNotification({ title: verified ? 'Marked as verified' : 'Marked as not verified' })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [updateImplementation, successNotification, errorNotification],
  )

  return { setVerified, isPending }
}
