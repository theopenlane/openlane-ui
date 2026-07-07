'use client'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'

export const step2Schema = z.object({
  userDetails: z.object({
    role: z.string().optional(),
    otherRole: z.string().optional(),
    department: z.string().optional(),
  }),
})

const departments = ['Engineering', 'Operations', 'Infosec', 'Corporate IT', 'Internal Audit', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Legal', 'Other']

const roles = ['C-Level', 'Director', 'Manager', 'Engineer', 'Operations', 'Internal Auditor', 'Customer Support', 'Sales', 'Marketing', 'Human Resources', 'Finance & Legal', 'Other (Please Specify)']

type Step2Values = zInfer<typeof step2Schema>

export default function Step2() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<Step2Values>()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">User Info</h2>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select onValueChange={(value) => setValue('userDetails.role', value, { shouldDirty: true, shouldValidate: true })} defaultValue={watch('userDetails.role')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.userDetails?.role && <p className="text-red-500 text-sm">{errors.userDetails.role.message}</p>}
      </div>

      {/* Custom input for "Other" role */}
      {watch('userDetails.role') === 'Other (Please Specify)' && (
        <div className="space-y-2">
          <Label htmlFor="otherRole">Please Specify</Label>
          <Input id="otherRole" placeholder="Enter your role" {...register('userDetails.otherRole')} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Department</Label>
        <Select onValueChange={(value) => setValue('userDetails.department', value, { shouldDirty: true, shouldValidate: true })} defaultValue={watch('userDetails.department')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.userDetails?.department && <p className="text-red-500 text-sm">{errors.userDetails.department.message}</p>}
      </div>
    </div>
  )
}
