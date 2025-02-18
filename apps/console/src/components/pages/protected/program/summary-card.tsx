import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { AlertTriangle, CheckIcon, ChevronDown, XCircle } from 'lucide-react'
import { FieldValues, FormProvider, useForm, useFormState } from 'react-hook-form'

const stepMapping: Record<string, string> = {
  'program-type': 'init',
  framework: 'init',
  name: 'init',
  'audit-period': 'init',
  'audit-partner': 'details',
  'team-members': 'invite',
}

const AccordionItemComponent = ({ value, label, icon, description, link, onClick }: any) => (
  <AccordionItem value={value} className="border-b">
    <AccordionTrigger className="py-4 w-full flex justify-between items-center group">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
    </AccordionTrigger>
    {description && (
      <AccordionContent className="my-3">
        <p className="text-sm">
          {description}{' '}
          {link && (
            <span className="text-blue-500 cursor-pointer underline" onClick={onClick}>
              {link}
            </span>
          )}
        </p>
      </AccordionContent>
    )}
  </AccordionItem>
)

interface SummaryCardProps {
  formData: FieldValues
  stepper: any
}

export const SummaryCard = ({ formData, stepper }: SummaryCardProps) => {
  const updatedAccordionItems = [
    {
      value: 'program-type',
      label: 'Program type chosen',
      icon: formData?.programType ? <CheckIcon className="text-green-400" size={16} /> : <XCircle className="text-red-600" size={16} />,
      description: formData?.programType ? `Selected program type: ${formData.programType}` : 'A program yype must be selected to create the program.',
      link: !formData?.programType ? 'Take me there.' : null,
    },
    ...(formData?.programType === 'framework'
      ? [
          {
            value: 'framework',
            label: 'Framework chosen',
            icon: formData?.framework ? <CheckIcon className="text-green-400" size={16} /> : <XCircle className="text-red-600" size={16} />,
            description: formData?.framework
              ? `Framework Selected: ${formData.framework}`
              : 'A framework must be selected to create the program. Choose from one of the provided options or choose `Custom` to make your own. ',
            link: !formData?.framework ? 'Take me there.' : null,
          },
        ]
      : []),
    {
      value: 'name',
      label: 'Name chosen',
      icon: formData?.name ? <CheckIcon className="text-green-400" size={16} /> : <XCircle className="text-red-600" size={16} />,
      description: formData?.name ? `Program Name: ${formData.name}` : 'A name must be provided to create the program. This should be a unique name that you can use to easily identify the program.',
      link: !formData?.name ? 'Take me there.' : null,
    },
    {
      value: 'audit-period',
      label: 'Audit period set',
      icon: formData?.startDate && formData?.endDate ? <CheckIcon className="text-green-400" size={16} /> : <AlertTriangle className="text-yellow-600" size={16} />,
      description:
        formData?.startDate && formData?.endDate ? `Audit Period: ${formData.startDate.toDateString()} - ${formData.endDate.toDateString()}` : 'An audit period is required to create the program.',
      link: !(formData?.startDate && formData?.endDate) ? 'Take me there.' : null,
    },
    {
      value: 'audit-partner',
      label: 'Audit partner provided',
      icon: formData?.auditPartnerName ? <CheckIcon className="text-green-400" size={16} /> : <AlertTriangle className="text-yellow-600" size={16} />,
      description: formData?.auditPartnerName ? (
        `Audit Partner: ${formData.auditPartnerName} ${formData.auditPartnerEmail}`
      ) : (
        <>
          Optional: If you already have an audit partner in mind, you can add them here. Check out our{' '}
          <span className="text-blue-500 cursor-pointer underline" onClick={() => stepper.goTo('details')}>
            auditor directory
          </span>{' '}
          to connect with top compliance auditors.
        </>
      ),
    },
    {
      value: 'team-members',
      label: 'Team members invited',
      icon: formData?.programMembers?.length || formData?.programAdmins?.length ? <CheckIcon className="text-green-400" size={16} /> : <AlertTriangle className="text-yellow-600" size={16} />,
      description:
        formData?.programMembers?.length || formData?.programAdmins?.length
          ? `Members: ${formData.programMembers?.length || 0}, Admins: ${formData.programAdmins?.length || 0}`
          : 'Invite members and admins to collaborate on the program.',
      link: !(formData?.programMembers?.length || formData?.programAdmins?.length) ? 'Take me there.' : null,
    },
  ]
  return (
    <div className="w-[391px] shrink-0 rounded-lg size-fit !mt-7 p-4 border pb-6">
      <h3 className="text-base font-semibold">Summary</h3>
      <p className="text-sm py-4">Confirm you&apos;ve filled out all the necessary information</p>

      <Accordion type="single" collapsible className="w-full">
        {updatedAccordionItems.map((item) => (
          <AccordionItemComponent
            key={item.value}
            {...item}
            onClick={() => {
              const stepId = stepMapping[item.value]

              if (stepId) {
                stepper.goTo(stepId)
              }
            }}
          />
        ))}
      </Accordion>
    </div>
  )
}
