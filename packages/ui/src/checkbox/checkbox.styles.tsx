import { tv, type VariantProps } from 'tailwind-variants'

export const checkboxStyles = tv({
  slots: {
    root: 'peer h-5 w-5 shrink-0 rounded-sm border border-java-400 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-firefly-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-aquamarine-900 ',
    indicator: 'flex items-center justify-center text-current',
    checkIcon: 'h-3 w-3',
  },
})

export type CheckboxVariants = VariantProps<typeof checkboxStyles>
