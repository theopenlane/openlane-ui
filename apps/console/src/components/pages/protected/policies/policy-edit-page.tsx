import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { useForm } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PolicyEditSidebar } from './policy-edit-sidebar'
import { InternalPolicyByIdFragment, useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useEffect, useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Info, InfoIcon } from 'lucide-react'

type PolicyEditPageProps = {
  policyId: string
}

export function PolicyEditPage({ policyId }: PolicyEditPageProps) {
  const [, updatePolicy] = useUpdateInternalPolicyMutation()
  const [{ data }] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: policyId } })
  const [policy, setPolicy] = useState({} as InternalPolicyByIdFragment)

  useEffect(() => {
    if (!data?.internalPolicy) return
    setPolicy(data.internalPolicy)
  }, [data])

  const formSchema = z.object({
    name: z.string().min(3, { message: 'Policy name is required' }),
    description: z.string().optional(),
    background: z.string().optional(),
    purposeAndScope: z.string().optional(),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      background: '',
      purposeAndScope: '',
    },
  })

  const handleSubmit = async (values: FormData) => {}
  const handleSave = async () => {}

  if (!data?.internalPolicy) return <></>

  const policyName = policy.displayID ? `${policy.displayID} - ${policy.name}` : policy.name

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={policyName} />

      <TwoColumnLayout
        aside={<PolicyEditSidebar policy={policy} handleSave={handleSave} />}
        main={
          <>
            <div className="border rounded-lg p-3 flex flex-row gap-3 align-top mt-0">
              <div>
                <InfoIcon size="16" />
              </div>
              <div>
                <h1>Not sure what to write?</h1>
                <p>
                  For template library and help docs, please refer to our{' '}
                  <a className="text-blue-600" href="https://docs.theopenlane.io/docs/category/policies-and-procedures" target="_blank">
                    documentation
                  </a>
                  .
                </p>
              </div>
            </div>
            {/* <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter token name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form> */}
          </>
        }
      ></TwoColumnLayout>
    </>
  )
}
