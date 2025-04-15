import { Loading } from '@/components/shared/loading/loading'
import CreateProcedureForm from './create/form/create-procedure-form.tsx'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures.ts'

type TEditProcedurePage = {
  procedureId: string
}

const EditProcedurePage: React.FC<TEditProcedurePage> = ({ procedureId }) => {
  const { data, isLoading } = useGetProcedureDetailsById(procedureId)

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && data?.procedure && <CreateProcedureForm procedure={data.procedure!} />}
    </>
  )
}

export default EditProcedurePage
