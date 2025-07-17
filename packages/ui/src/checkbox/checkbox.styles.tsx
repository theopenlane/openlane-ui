import { tv, type VariantProps } from 'tailwind-variants'

export const checkboxStyles = tv({
  slots: {
    root: 'peer h-5 w-5 shrink-0 bg-checkbox rounded-md border border-border ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-teal-900 data-[state=checked]:bg-teal-500',
    indicator: 'flex items-center justify-center text-current',
    checkIcon: 'h-3 w-3 text-brand-900',
  },
})

export type CheckboxVariants = VariantProps<typeof checkboxStyles>
