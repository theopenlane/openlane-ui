'use client'

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { useWatch } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Form } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import { Separator } from '@repo/ui/separator'
import { type CreateStandardInput } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { withReturnTo } from '@/utils/return-to'
import { useCreateStandard } from '@/lib/graphql-hooks/standard'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { standardControlsImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { StepNav } from '@/components/shared/step-nav/step-nav'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { FrameworkDetailsFields } from './framework-details-fields'
import { FrameworkIconPicker } from './framework-icon-picker'
import { ControlsStep } from './steps/controls-step'
import { ReviewStep } from './steps/review-step'
import { STANDARDS_CATALOG_HREF, standardHref } from './custom-framework'
import { useLinkControlsToStandard } from './hooks/use-link-controls-to-standard'
import { CatalogPreview } from './catalog-preview'
import { ControlSource, type TCreateFrameworkFormData, useCreateFrameworkForm } from './hooks/use-custom-framework-form-schema'

const STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'icon', label: 'Icon' },
  { id: 'controls', label: 'Controls' },
  { id: 'review', label: 'Review' },
] as const

type TStepId = (typeof STEPS)[number]['id']

const DETAILS_FIELDS = ['name', 'shortName', 'framework', 'standardType', 'governingBody', 'version', 'link', 'tags', 'description'] as const satisfies readonly (keyof TCreateFrameworkFormData)[]

const toCreateStandardInput = (values: TCreateFrameworkFormData): CreateStandardInput => ({
  name: values.name,
  shortName: values.shortName,
  framework: values.framework || undefined,
  standardType: values.standardType || undefined,
  governingBody: values.governingBody || undefined,
  version: values.version || undefined,
  link: values.link || undefined,
  tags: values.tags.length ? values.tags : undefined,
  description: values.description || undefined,
})

const CreateCustomFrameworkWizard: React.FC = () => {
  const router = useRouter()
  const { setCrumbs } = use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const { data: session } = useSession()
  const { data: permission, isPending: isPermissionPending } = useOrganizationRoles()
  const form = useCreateFrameworkForm()
  const [stepIndex, setStepIndex] = useState(0)
  const [logo, setLogo] = useState<TUploadedFile | null>(null)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const { mutateAsync: createStandard, isPending: isCreating } = useCreateStandard()
  const { linkControls, isPending: isLinking } = useLinkControlsToStandard()

  const [name, shortName = '', controlSource, linkedControls] = useWatch({ control: form.control, name: ['name', 'shortName', 'controlSource', 'linkedControls'] })
  const step: TStepId = STEPS[stepIndex].id
  const isLastStep = stepIndex === STEPS.length - 1
  const isSubmitting = isCreating || isLinking
  const logoSrc = logo?.url ?? null
  const canCreate = hasPermission(permission?.roles, AccessEnum.CanCreateStandard, session)

  const navGuard = useNavigationGuard({ enabled: form.formState.isDirty && !redirectTo })

  useEffect(() => {
    if (redirectTo) router.push(redirectTo)
  }, [redirectTo, router])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Compliance', href: '/programs' }, { label: 'Standards', href: STANDARDS_CATALOG_HREF }, { label: 'Create framework' }])
  }, [setCrumbs])

  const goTo = (id: TStepId) => setStepIndex(STEPS.findIndex((candidate) => candidate.id === id))

  const linkSelectionMissing = step === 'controls' && controlSource === ControlSource.LINK && !linkedControls.length
  const continueDisabledReason = linkSelectionMissing ? 'Select at least one control to link, or choose another option.' : undefined

  const handleContinue = async () => {
    if (step === 'details' && !(await form.trigger(DETAILS_FIELDS))) return
    if (linkSelectionMissing) return
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    if (stepIndex === 0) {
      router.push(STANDARDS_CATALOG_HREF)
      return
    }
    setStepIndex((index) => index - 1)
  }

  const handleCreate = async (data: TCreateFrameworkFormData) => {
    let standardId: string
    try {
      const response = await createStandard({ input: toCreateStandardInput(data), logoFile: logo?.file })
      standardId = response.createStandard.standard.id
    } catch (error) {
      errorNotification({ title: 'Could not create the framework', description: parseErrorMessage(error) })
      return
    }

    const frameworkHref = standardHref(standardId)

    if (data.controlSource === ControlSource.CSV) {
      successNotification({ title: 'Framework created', description: `${data.name} is in the Standards Catalog. Upload your controls file next.` })
      setRedirectTo(withReturnTo(standardControlsImportRoute(standardId, data.shortName).href, frameworkHref))
      return
    }

    if (data.controlSource === ControlSource.LINK && data.linkedControls.length) {
      try {
        const { failed } = await linkControls(
          standardId,
          data.linkedControls.map((linked) => linked.id),
        )
        if (failed) {
          errorNotification({
            title: 'Framework created, but some controls were not linked',
            description: `${pluralizeWithCount(failed, 'control')} could not be linked. You can link them from the framework page.`,
          })
          setRedirectTo(frameworkHref)
          return
        }
      } catch (error) {
        errorNotification({ title: 'Framework created, but controls were not linked', description: `${parseErrorMessage(error)} You can link them from the framework page.` })
        setRedirectTo(frameworkHref)
        return
      }
    }

    successNotification({ title: 'Framework created', description: `${data.name} is now in the Standards Catalog.` })
    setRedirectTo(frameworkHref)
  }

  if (!isPermissionPending && !canCreate) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>You do not have permission to create frameworks. Ask an organization owner or admin for access.</p>
        <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(STANDARDS_CATALOG_HREF)}>
          Back to Standards Catalog
        </Button>
      </div>
    )
  }

  const primaryLabel = controlSource === ControlSource.CSV ? 'Create and import controls' : 'Create framework'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      <div>
        <Button variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(STANDARDS_CATALOG_HREF)}>
          Back to Standards Catalog
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <PageHeading heading="Create framework" />
        <p className="text-sm text-muted-foreground">Set up a framework your organization defines. You can change any of this later.</p>
      </div>
      <StepNav steps={STEPS} current={step} ariaLabel="Create framework steps" />
      <Separator separatorClass="bg-card" />

      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (isLastStep) {
              form.handleSubmit(handleCreate)(event)
            } else {
              handleContinue()
            }
          }}
          className="flex flex-col gap-8"
        >
          {step === 'details' && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <FrameworkDetailsFields isCreate />
              <CatalogPreview logoSrc={logoSrc} />
            </div>
          )}

          {step === 'icon' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">Icon</h2>
                <p className="text-sm text-muted-foreground">Optional. Give {name || 'your framework'} an icon so it is easy to spot in the catalog.</p>
              </div>
              <FrameworkIconPicker shortName={shortName} logoSrc={logoSrc} onUpload={setLogo} onRemove={() => setLogo(null)} />
            </div>
          )}

          {step === 'controls' && <ControlsStep />}

          {step === 'review' && <ReviewStep logoSrc={logoSrc} onEditDetails={() => goTo('details')} onEditControls={() => goTo('controls')} />}

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                {stepIndex === 0 ? 'Cancel' : 'Back'}
              </Button>
              <DisabledReasonTooltip reason={continueDisabledReason}>
                <Button type="submit" disabled={!!continueDisabledReason || isSubmitting} loading={isSubmitting}>
                  {isLastStep ? primaryLabel : 'Continue'}
                </Button>
              </DisabledReasonTooltip>
            </div>
          </div>
        </form>
      </Form>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}

export default CreateCustomFrameworkWizard
