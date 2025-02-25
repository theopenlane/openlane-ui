'use client'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'

export const step2Schema = z.object({
  userDetails: z
    .object({
      role: z.string().optional(),
      department: z.string().optional(), // ✅ Made department optional
    })
    .optional(),
})

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

      {/* User Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Role*</Label>
        <Input id="role" {...register('userDetails.role')} required />
        {errors.userDetails?.role && <p className="text-red-500 text-sm">{errors.userDetails.role.message}</p>}
      </div>

      {/* User Department (Optional) */}
      <div className="space-y-2">
        <Label>Department (Optional)</Label>
        <Select onValueChange={(value) => setValue('userDetails.department', value)} defaultValue={watch('userDetails.department')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select department (Optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
