import React, { useEffect, useState } from 'react'
import { useDeleteRisk, useGetRiskById, useUpdateRisk } from '@/lib/graphql-hooks/risks.ts'
import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema.ts'
import useFormSchema, { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { Loading } from '@/components/shared/loading/loading.tsx'
import { Form } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { PencilIcon, SaveIcon, Trash2, XIcon } from 'lucide-react'
import Menu from '@/components/shared/menu/menu.tsx'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import TagsCard from '@/components/pages/protected/policies/view/cards/tags-card.tsx'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import TitleField from './fields/title-field'
import DetailsField from './fields/details-field'
import AssociatedObjectsViewAccordion from '../accordion/associated-objects-view-accordion'
import AuthorityCard from './cards/authority-card'
import PropertiesCard from '@/components/pages/protected/risks/view/cards/properties-card.tsx'

type TRisksPageProps = {
  riskId: string
}

const ViewRisksPage: React.FC<TRisksPageProps> = ({ riskId }) => {
  const { risk, isLoading } = useGetRiskById(riskId)
  const { mutateAsync: updateRisk, isPending } = useUpdateRisk()
  const { mutateAsync: deleteRisk } = useDeleteRisk()

  const { successNotification, errorNotification } = useNotification()
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.RISK, riskId)
  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (risk) {
      form.reset({
        name: risk.name ?? '',
        riskType: risk.riskType ?? '',
        category: risk.category ?? '',
        score: risk.score ?? 0,
        impact: risk.impact ?? RiskRiskImpact.LOW,
        likelihood: risk.likelihood ?? RiskRiskLikelihood.UNLIKELY,
        status: risk.status ?? RiskRiskStatus.OPEN,
        details: risk.details ?? '',
        mitigation: risk.mitigation ?? '',
        businessCosts: risk.businessCosts ?? '',
        tags: risk.tags || [],
      })
    }
  }, [risk])

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleDeleteRisk = async () => {
    try {
      await deleteRisk({ deleteRiskId: riskId })
      successNotification({ title: 'Risk deleted successfully' })
      router.push('/risks')
    } catch {
      errorNotification({ title: 'Error deleting risk' })
    }
  }

  const onSubmitHandler = async (values: EditRisksFormData) => {
    if (!risk?.id) {
      return
    }

    try {
      await updateRisk({
        id: risk.id,
        input: {
          name: values.name,
          riskType: values.riskType,
          category: values.category,
          score: values.score,
          impact: values.impact,
          likelihood: values.likelihood,
          status: values.status,
          details: values.details,
          mitigation: values.mitigation,
          businessCosts: values.businessCosts,
          tags: values.tags,
        },
      })

      successNotification({
        title: 'Risk updated',
        description: 'The risk was successfully updated.',
      })

      setIsEditing(false)
    } catch (err) {
      errorNotification({
        title: 'Error updating risk',
        description: 'Something went wrong.',
      })
    }
  }

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && risk && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <TitleField isEditing={isEditing} form={form} />
              <DetailsField isEditing={isEditing} form={form} risk={risk} />
              <AssociatedObjectsViewAccordion risk={risk} />
            </div>
            <div className="space-y-4">
              {isEditing ? (
                <div className="flex gap-2 justify-end">
                  <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
                    Cancel
                  </Button>
                  <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />} disabled={isPending}>
                    {isPending ? 'Saving' : 'Save'}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 justify-end">
                  {!editAllowed && !deleteAllowed ? (
                    <></>
                  ) : (
                    <Menu
                      content={
                        <>
                          {editAllowed && (
                            <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleEdit}>
                              <PencilIcon size={16} strokeWidth={2} />
                              <span>Edit</span>
                            </div>
                          )}
                          {deleteAllowed && (
                            <>
                              <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={() => setIsDeleteDialogOpen(true)}>
                                <Trash2 size={16} strokeWidth={2} />
                                <span>Delete</span>
                              </div>
                              <ConfirmationDialog
                                open={isDeleteDialogOpen}
                                onOpenChange={setIsDeleteDialogOpen}
                                onConfirm={handleDeleteRisk}
                                description="This action cannot be undone. This will permanently remove the policy from the organization."
                              />
                            </>
                          )}
                        </>
                      }
                    />
                  )}
                </div>
              )}
              <AuthorityCard form={form} stakeholder={risk.stakeholder} delegate={risk.delegate} isEditing={isEditing} />
              <PropertiesCard form={form} isEditing={isEditing} risk={risk} />
              {/*<TagsCard form={form} policy={policy} isEditing={isEditing} />*/}
            </div>
          </form>
        </Form>
      )}
    </>
  )
}

export default ViewRisksPage
