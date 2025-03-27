'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Pencil, Check } from 'lucide-react'
import { Circle } from 'lucide-react'
import { useGetRiskById, useUpdateRisk } from '@/lib/graphql-hooks/risks'
import { Risk, RiskFieldsFragment } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import RiskLabel from './risk-label'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { z } from 'zod'
import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNotification } from '@/hooks/useNotification'

const riskFormSchema = z.object({
  name: z.string().min(1),
  riskType: z.string(),
  category: z.string(),
  score: z.coerce.number().min(0).max(100),
  impact: z.nativeEnum(RiskRiskImpact),
  likelihood: z.nativeEnum(RiskRiskLikelihood),
  status: z.nativeEnum(RiskRiskStatus),
  details: z.string().optional(),
  mitigation: z.string().optional(),
  businessCosts: z.string().optional(),
})

const RiskDetailsSheet = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const riskId = searchParams.get('id')
  const { data, isLoading } = useGetRiskById(riskId)
  const [isEditing, setIsEditing] = useState(false)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateRisk, isPending } = useUpdateRisk()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(riskFormSchema),
    defaultValues: {
      name: '',
      riskType: '',
      category: '',
      score: 0,
      impact: RiskRiskImpact.LOW,
      likelihood: RiskRiskLikelihood.UNLIKELY,
      status: RiskRiskStatus.OPEN,
      details: '',
      mitigation: '',
      businessCosts: '',
    },
  })

  const risk = data?.risk as RiskFieldsFragment

  useEffect(() => {
    if (risk) {
      reset({
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
      })
    }
  }, [risk, reset])

  const handleSheetClose = () => {
    if (isEditing && isDirty) {
      const confirmClose = window.confirm('Discard changes?')
      if (!confirmClose) return
    }
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
    setIsEditing(false)
  }

  const onSubmit = async (values: z.infer<typeof riskFormSchema>) => {
    if (!risk?.id) return

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
    <Sheet open={!!riskId} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card overflow-y-auto">
        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SheetHeader className="flex flex-row items-end justify-end">
              <div className="flex gap-2 mt-1">
                {isEditing ? (
                  <>
                    <Button type="button" icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" icon={<Check size={14} />}>
                      {isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button type="button" icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1">
              <SheetTitle>{isEditing ? <Controller name="name" control={control} render={({ field }) => <Input {...field} />} /> : watch('name') || 'Unnamed Risk'}</SheetTitle>
            </div>

            <div className="grid grid-cols-[160px_1fr] gap-y-3 text-sm mt-6">
              <FieldRow label="Type">{isEditing ? <Controller name="riskType" control={control} render={({ field }) => <Input {...field} />} /> : watch('riskType')}</FieldRow>
              <FieldRow label="Category">{isEditing ? <Controller name="category" control={control} render={({ field }) => <Input {...field} />} /> : watch('category')}</FieldRow>
              <FieldRow label="Score">
                <Controller name="score" control={control} render={({ field }) => <RiskLabel isEditing={isEditing} score={field.value} onChange={field.onChange} />} />
              </FieldRow>
              <FieldRow label="Impact">
                <Controller name="impact" control={control} render={({ field }) => <RiskLabel isEditing={isEditing} impact={field.value} onChange={field.onChange} />} />
              </FieldRow>
              <FieldRow label="Likelihood">
                <Controller name="likelihood" control={control} render={({ field }) => <RiskLabel isEditing={isEditing} likelihood={field.value} onChange={field.onChange} />} />
              </FieldRow>
              <FieldRow label="Status">
                <Controller name="status" control={control} render={({ field }) => <RiskLabel isEditing={isEditing} status={field.value} onChange={field.onChange} />} />
              </FieldRow>
              <FieldRow label="Tags">
                <div className="flex flex-wrap gap-2">
                  {risk?.tags?.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs lowercase">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </FieldRow>
            </div>

            {['details', 'mitigation', 'businessCosts'].map((fieldKey) => (
              <div key={fieldKey}>
                <p className="text-xl font-semibold mb-1 text-header">{fieldKey[0].toUpperCase() + fieldKey.slice(1)}</p>
                {isEditing ? (
                  <Controller name={fieldKey as any} control={control} render={({ field }) => <Textarea {...field} />} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{watch(fieldKey as any) || '-'}</p>
                )}
              </div>
            ))}
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default RiskDetailsSheet

const FieldRow = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <>
    <div className="flex gap-1 items-center">
      <Circle className="text-brand" size={16} />
      <div className="text-muted-foreground">{label}</div>
    </div>
    <div className="flex gap-1 text-sm">{children}</div>
  </>
)
