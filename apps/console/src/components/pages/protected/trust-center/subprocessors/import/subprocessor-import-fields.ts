import { type CreateSubprocessorInput, type CreateTrustCenterSubprocessorInput } from '@repo/codegen/src/schema'
import type { TDestinationField } from '@/components/shared/record-import/lib/types'
import type { TStaticFieldSet } from '@/components/shared/record-import/lib/destination-fields'

export type TSubprocessorImportField =
  keyof Pick<CreateSubprocessorInput, 'name' | 'description' | 'tags' | 'logoRemoteURL'> | keyof Pick<CreateTrustCenterSubprocessorInput, 'countries' | 'trustCenterSubprocessorKindName'> | 'website'

type TFieldOptions = Pick<TDestinationField, 'requirement' | 'aliases'>

const field = (name: TSubprocessorImportField, label: string, description: string, example: string, options: TFieldOptions = {}): TDestinationField => ({
  name,
  label,
  description,
  example,
  fuzzyMatchable: true,
  ...options,
})

const NAME_FIELD = field('name', 'Name', "The subprocessor's company name. Matched against Openlane's subprocessor catalog.", 'Amazon Web Services', {
  requirement: 'required',
  aliases: ['subprocessor', 'subprocessor name', 'provider', 'vendor', 'supplier', 'company', 'processor'],
})

export const SUBPROCESSOR_IMPORT_FIELD_SET: TStaticFieldSet = {
  fields: [
    NAME_FIELD,
    field('website', 'Website', 'Company website or domain. Used to fetch a logo for subprocessors that are created as custom ones.', 'aws.amazon.com', {
      aliases: ['domain', 'url', 'website url', 'homepage', 'site', 'company website', 'webpage'],
    }),
    field('description', 'Description', 'What the subprocessor does. Only used for subprocessors that are created as custom ones.', 'Cloud infrastructure hosting', {
      aliases: ['purpose', 'service description', 'processing purpose'],
    }),
    field('countries', 'Countries', 'Countries where the subprocessor processes data: country names or ISO codes, separated by ; or | or ,.', 'United States; Germany', {
      aliases: ['country', 'location', 'locations', 'data location', 'processing location'],
    }),
    field('trustCenterSubprocessorKindName', 'Category', 'The subprocessor category shown in your Trust Center. New categories are created for you.', 'Infrastructure', {
      aliases: ['category', 'categories'],
    }),
    field('tags', 'Tags', 'Tags for subprocessors that are created as custom ones, separated by ; or | or ,.', 'hosting; cloud'),
    field('logoRemoteURL', 'Logo URL', 'An https logo image URL for subprocessors that are created as custom ones. Overrides the website icon.', 'https://example.com/logo.png', {
      aliases: ['logo', 'logo url', 'icon'],
    }),
  ],
  requiredGroups: [[NAME_FIELD]],
  primaryField: 'name',
}
