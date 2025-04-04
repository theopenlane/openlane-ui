'use client'

import React from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { ControlFieldsFragment, Group } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CircleUser, CircleArrowRight } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useFormContext, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'

interface AuthorityCardProps {
  controlOwner: ControlFieldsFragment['controlOwner']
  delegate: ControlFieldsFragment['delegate']
  isEditing: boolean
}

const AuthorityCard: React.FC<AuthorityCardProps> = ({ controlOwner, delegate, isEditing }) => {
  const { data } = useGetAllGroups({}, isEditing)
  const { control } = useFormContext()

  const groups = data?.groups?.edges?.map((edge) => edge?.node!) || []

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="flex flex-col gap-4">
        {/* Owner */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <CircleUser size={16} className="text-brand" />
            <span>Owner</span>
          </div>

          {isEditing ? (
            <Controller
              control={control}
              name="controlOwnerID"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select owner group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <div className="flex gap-2">
              <Avatar entity={controlOwner as Group} variant="small" />
              <span>{controlOwner?.displayName || 'No Owner'}</span>
            </div>
          )}
        </div>

        {/* Delegate */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <CircleArrowRight size={16} className="text-brand" />
            <span>Delegate</span>
          </div>

          {isEditing ? (
            <Controller
              control={control}
              name="delegateID"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select delegate group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <div className="flex gap-2">
              <Avatar entity={delegate as Group} variant="small" />
              <span>{delegate?.displayName || 'No Delegate'}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default AuthorityCard
