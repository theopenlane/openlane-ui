'use client'

import React from 'react'
import { ContactUserStatus, type CreateContactInput } from '@repo/codegen/src/schema'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreateContact } from '@/lib/graphql-hooks/contact'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import useFormSchema from '../hooks/use-form-schema'
import { getFieldsToRender } from '../table/table-config'
import { type ContactFieldProps, objectType } from '../table/types'

type ContactCreateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusOptions = enumToOptions(ContactUserStatus)

const ContactCreateSheet: React.FC<ContactCreateSheetProps> = ({ open, onOpenChange }) => {
  const { form } = useFormSchema()
  const { tagOptions } = useGetTags()
  const baseCreateMutation = useCreateContact()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateContactInput) => baseCreateMutation.mutateAsync({ input }),
  }

  return (
    <GenericDetailsSheet
      objectType={objectType}
      form={form}
      data={undefined}
      isFetching={false}
      isCreateMode={open}
      entityId={null}
      onClose={() => onOpenChange(false)}
      createMutation={createMutation}
      buildPayload={async (data) => ({ ...data })}
      renderFields={(props: ContactFieldProps) => getFieldsToRender(props, { statusOptions, tagOptions })}
    />
  )
}

export default ContactCreateSheet
