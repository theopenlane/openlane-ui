import { tv, type VariantProps } from 'tailwind-variants'

const billingSettingsStyles = tv({
  slots: {
    panel: 'p-6',
    section: 'flex justify-between items-start py-6 border-b border-gray-300 last:border-b-0',
    sectionTitle: 'text-xl font-medium text-text-header w-1/5',
    sectionContent: 'flex justify-between w-full gap-4',
    text: 'text-sm mb-2',
    paragraph: 'text-text-paragraph text-sm',
    emailText: 'mt-2 text-text-paragraph font-medium',
    switchContainer: 'flex justify-between w-full gap-4',
  },
})

export type BillingSettingsVariants = VariantProps<typeof billingSettingsStyles>

export { billingSettingsStyles }
