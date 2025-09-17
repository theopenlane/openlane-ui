import { tv, type VariantProps } from 'tailwind-variants'

const billingSettingsStyles = tv({
  slots: {
    panel: 'w-full',
    section: 'flex justify-between items-start py-6 border-b last:border-b',
    sectionTitle: 'text-xl font-medium text-text-header',
    sectionContent: 'flex justify-between w-full gap-4',
    text: 'text-sm mb-2',
    paragraph: 'text-text-paragraph text-sm',
    emailText: 'mt-2 text-text-paragraph font-medium',
    switchContainer: 'flex justify-between w-full gap-4',
  },
})

export type BillingSettingsVariants = VariantProps<typeof billingSettingsStyles>

export { billingSettingsStyles }
