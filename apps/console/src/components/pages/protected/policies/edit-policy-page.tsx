import CreatePolicyForm from '@/components/pages/protected/policies/form/create-policy-form.tsx'
import { Loading } from '@/components/shared/loading/loading'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy.ts'

type TEditPolicyPage = {
  policyId: string
  readonly?: boolean
}

const EditPolicyPage: React.FC<TEditPolicyPage> = ({ policyId, readonly }) => {
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId)

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && data?.internalPolicy && <CreatePolicyForm readonly={readonly} policy={data.internalPolicy!} />}
    </>
  )
}

export default EditPolicyPage
