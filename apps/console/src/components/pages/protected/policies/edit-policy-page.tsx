import { Loading } from '@/components/shared/loading/loading'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/internal-policy'
import CreatePolicyForm from './create/form/create-policy-form'

type TEditPolicyPage = {
  policyId: string
}

const EditPolicyPage = ({ policyId }: TEditPolicyPage) => {
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId)

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && data?.internalPolicy && <CreatePolicyForm policy={data.internalPolicy!} />}
    </>
  )
}

export default EditPolicyPage
