import { tv, type VariantProps } from 'tailwind-variants'

const billingSettingsStyles = tv({
  slots: {
    panel: 'w-full',
    section: 'flex justify-between items-start py-6 border-b',
    sectionContent: 'flex justify-between w-2/3 gap-4',
    text: 'text-sm mb-2 text-text-informational',
    paragraph: 'text-text-paragraph text-sm',
    emailText: 'mt-2 text-text-paragraph font-medium',
    switchContainer: 'flex justify-between w-full gap-4',
  },
})

export type BillingSettingsVariants = VariantProps<typeof billingSettingsStyles>

export { billingSettingsStyles }
