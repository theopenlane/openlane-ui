import CreatePolicyForm from '@/components/pages/protected/policies/form/create-policy-form.tsx'
import { Loading } from '@/components/shared/loading/loading'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy.ts'

type TEditPolicyPage = {
  policyId: string
}

const EditPolicyPage: React.FC<TEditPolicyPage> = ({ policyId }) => {
  const { data, isLoading, isError } = useGetInternalPolicyDetailsById(policyId)

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && data?.internalPolicy && <CreatePolicyForm policy={data.internalPolicy!} />}
    </>
  )
}

export default EditPolicyPage
