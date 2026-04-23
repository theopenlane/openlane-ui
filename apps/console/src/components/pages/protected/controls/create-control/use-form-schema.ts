import { z } from 'zod'
import { ControlControlSource, ControlControlStatus } from '@repo/codegen/src/schema'
import { type Value } from 'platejs'

export const controlFormSchema = z.object({
  refCode: z.string().min(1, 'Ref Code is required'),
  title: z.string().optional(),
  description: z.any(),
  descriptionJSON: z.custom<Value>().optional(),
  controlOwnerID: z.string().optional(),
  delegateID: z.string().optional(),
  responsiblePartyID: z.string().optional(),
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
  publicRepresentation: z.any().optional(),
  internalPolicyIDs: z.array(z.string()).optional(),
  procedureIDs: z.array(z.string()).optional(),
  taskIDs: z.array(z.string()).optional(),
  programIDs: z.array(z.string()).optional(),
  riskIDs: z.array(z.string()).optional(),
  assetIDs: z.array(z.string()).optional(),
  scanIDs: z.array(z.string()).optional(),
  entityIDs: z.array(z.string()).optional(),
  identityHolderIDs: z.array(z.string()).optional(),
  campaignIDs: z.array(z.string()).optional(),
  remediationIDs: z.array(z.string()).optional(),
  reviewIDs: z.array(z.string()).optional(),
  findingIDs: z.array(z.string()).optional(),
  subcontrolIDs: z.array(z.string()).optional(),
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
