import { tv, type VariantProps } from 'tailwind-variants'

export const switchStyles = tv({
  slots: {
    base: 'peer  inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blackberry-900 data-[state=unchecked]:bg-blackberry-900',
    thumb:
      'pointer-events-none block h-5 w-5 rounded-full bg-white ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  },
})

export type SwitchVariants = VariantProps<typeof switchStyles>
