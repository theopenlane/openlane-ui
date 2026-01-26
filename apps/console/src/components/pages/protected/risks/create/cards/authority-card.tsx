'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Stamp, CircleArrowRight } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Option } from '@repo/ui/multiple-selector'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups.ts'
import { CreateRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'

type TAuthorityCardProps = {
  form: UseFormReturn<CreateRisksFormData>
  inputClassName?: string
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, inputClassName }) => {
  const { data } = useGetAllGroups({ where: {}, enabled: true })
  const groups = data?.groups?.edges?.map((edge) => edge?.node) || []

  const options: Option[] = groups.map((g) => ({
    label: g?.displayName || g?.name || '',
    value: g?.id || '',
  }))
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="grid grid-cols-[min-content_250px] gap-y-4 gap-x-8 items-center">
        {/* Stakeholder */}
        <div className={`flex gap-2 items-center ${inputClassName ?? ''}`}>
          <Stamp size={16} className="text-brand" />
          <span>Stakeholder</span>
        </div>
        <div className="w-40 min-w-0">
          <Controller
            name="stakeholderID"
            control={form.control}
            render={({ field }) => <SearchableSingleSelect className="w-full" value={field.value} options={options} placeholder="Select stakeholder" onChange={(val) => field.onChange(val)} />}
          />
        </div>

        {/* Delegate */}
        <div className={`flex gap-2 items-center ${inputClassName ?? ''}`}>
          <CircleArrowRight size={16} className="text-brand" />
          <span>Delegate</span>
        </div>
        <div className="w-40 min-w-0">
          <Controller
            name="delegateID"
            control={form.control}
            render={({ field }) => <SearchableSingleSelect className="w-full" value={field.value} options={options} placeholder="Select delegate" onChange={(val) => field.onChange(val)} />}
          />
        </div>
      </div>
    </Card>
  )
}

export default AuthorityCard
