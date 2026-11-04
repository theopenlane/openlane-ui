import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { isValidUrl } from '@/utils/normalizeUrl'
import { VersionBump } from '@/lib/enums/revision-enum'

export enum ControlSource {
  CSV = 'csv',
  LINK = 'link',
  SKIP = 'skip',
}

export const toControlSource = (value: string): ControlSource | undefined => Object.values(ControlSource).find((source) => source === value)

const optionalText = z.string().trim().optional()

const buildDetailsSchema = (requireCategory: boolean) =>
  z.object({
    name: z.string().trim().min(1, 'Name is required'),
    shortName: z.string().trim().min(1, 'Short name is required'),
    framework: optionalText,
    standardType: z
      .string()
      .trim()
      .optional()
      .refine((value) => !requireCategory || !!value, 'Category is required'),
    governingBody: optionalText,
    version: optionalText,
    link: z
      .string()
      .trim()
      .optional()
      .refine((url) => !url || isValidUrl(url), 'Enter a valid URL, such as https://example.com'),
    tags: z.array(z.string()),
    description: optionalText,
  })

const detailsSchema = buildDetailsSchema(false)

export type TFrameworkDetailsFormData = z.infer<typeof detailsSchema>

const linkedControlSchema = z.object({ id: z.string(), refCode: z.string() })

export type TLinkedControl = z.infer<typeof linkedControlSchema>

const createWizardSchema = buildDetailsSchema(true).extend({
  controlSource: z.nativeEnum(ControlSource),
  linkedControls: z.array(linkedControlSchema),
})

export type TCreateFrameworkFormData = z.infer<typeof createWizardSchema>

const editSchema = detailsSchema.extend({
  RevisionBump: z.nativeEnum(VersionBump),
})

export type TEditFrameworkFormData = z.infer<typeof editSchema>

const CREATE_FRAMEWORK_DEFAULTS: TCreateFrameworkFormData = {
  name: '',
  shortName: '',
  framework: '',
  standardType: '',
  governingBody: '',
  version: '',
  link: '',
  tags: [],
  description: '',
  controlSource: ControlSource.CSV,
  linkedControls: [],
}

export const useCreateFrameworkForm = () =>
  useForm<TCreateFrameworkFormData>({
    resolver: zodResolver(createWizardSchema),
    mode: 'onChange',
    defaultValues: CREATE_FRAMEWORK_DEFAULTS,
  })

export const useEditFrameworkForm = () =>
  useForm<TEditFrameworkFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { tags: [], RevisionBump: VersionBump.PATCH },
  })
