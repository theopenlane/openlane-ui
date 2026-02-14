import { useRouter } from 'next/navigation'
import { SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'

export const CreateTemplateButton = () => {
  const router = useRouter()

  const handleCreateNew = () => {
    router.push('/questionnaires/templates/template-editor')
  }

  return (
    <Button variant="primary" onClick={handleCreateNew} className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
      Create
    </Button>
  )
}
