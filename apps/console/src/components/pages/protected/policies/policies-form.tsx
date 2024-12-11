'use client'

import React, { useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Input, InputRow } from '@repo/ui/input'
import dynamic from 'next/dynamic'
import { Button } from '@repo/ui/button'

import {
  Form,
  FormItem,
  FormField,
  FormControl,
  FormMessage,
  FormLabel,
} from '@repo/ui/form'

const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), {
  ssr: false,
})

const PolicyFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 5 chars' }),
  description: z.string().optional(),
  purposeAndScope: z.string().optional(),
  policyType: z.string().optional(),
  background: z.string().optional(),
})

export type PolicyFormSchema = z.infer<typeof PolicyFormSchema>

type Props = {
  policy?: PolicyFormSchema
  onSubmit: (policy: PolicyFormSchema) => Promise<void>
}

export const PoliciesForm: React.FC<Props> = ({ onSubmit, policy }) => {
  const form = useForm<z.infer<typeof PolicyFormSchema>>({
    resolver: zodResolver(PolicyFormSchema),
    defaultValues: {
      name: policy?.name || '',
      description: policy?.description,
      purposeAndScope: policy?.purposeAndScope,
      policyType: policy?.policyType,
      background: policy?.background,
      details: policy?.details,
    },
  })

  useEffect(() => {
    form.setValue('name', policy?.name || '')
    form.setValue('description', policy?.description)
    form.setValue('purposeAndScope', policy?.purposeAndScope)
    form.setValue('policyType', policy?.policyType)
    form.setValue('background', policy?.background)
    form.setValue('details', policy?.details)
  }, [policy])

  return (
    <>
      <pre>{JSON.stringify(policy, null, 2)}</pre>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <InputRow>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <InputRow>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <InputRow>
            <FormField
              control={form.control}
              name="policyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Type</FormLabel>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <InputRow>
            <FormField
              control={form.control}
              name="purposeAndScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose and Scope</FormLabel>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <InputRow>
            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background</FormLabel>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <Button type="submit">Save</Button>
        </form>
      </Form>

      <div className="h-[90%]">
        <PlateEditor />
      </div>
    </>
  )
}
