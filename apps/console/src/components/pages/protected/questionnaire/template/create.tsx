import { useRouter } from 'next/navigation'
import { SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { tableActionTestId } from '@/components/shared/crud-base/table/table-action-test-id'

export const CreateTemplateButton = () => {
  const router = useRouter()

  const handleCreateNew = () => {
    router.push('/automation/questionnaires/templates/template-editor')
  }

  return (
    <Button variant="primary" onClick={handleCreateNew} className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left" data-testid={tableActionTestId(ObjectTypes.TEMPLATE, 'create')}>
      Create
    </Button>
  )
}
