import { z } from 'zod'
import { ControlControlSource, ControlControlStatus } from '@repo/codegen/src/schema'
import { Value } from 'platejs'

export const controlFormSchema = z.object({
  refCode: z.string().min(1, 'Name is required'),
  description: z.any(),
  descriptionJSON: z.custom<Value>().optional(),
  controlOwnerID: z.string().optional(),
  delegateID: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  status: z.nativeEnum(ControlControlStatus).optional(),
  mappedCategories: z.array(z.string()).optional(),
  controlID: z.string().min(1, 'Parent Control is required'),
  source: z.nativeEnum(ControlControlSource).optional(),
  controlKindName: z.string().optional(),
  subcontrolKindName: z.string().optional(),
  referenceID: z.string().optional(),
  auditorReferenceID: z.string().optional(),
  desiredOutcome: z.any(),
  details: z.any(),
})

export const createControlFormSchema = (isCreateSubcontrol: boolean) =>
  controlFormSchema
    .extend({
      controlID: z.string().optional(), // make it optional first
    })
    .superRefine((data, ctx) => {
      if (isCreateSubcontrol && (!data.controlID || data.controlID.trim() === '')) {
        ctx.addIssue({
          path: ['controlID'],
          code: z.ZodIssueCode.custom,
          message: 'Parent Control is required',
        })
      }
    })

export type ControlFormData = z.infer<ReturnType<typeof createControlFormSchema>>
