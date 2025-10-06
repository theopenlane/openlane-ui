import { tv, type VariantProps } from 'tailwind-variants'

export const switchStyles = tv({
  slots: {
    base: 'peer bg-primary-muted inline-flex h-4 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-primary-muted',
    thumb:
      'pointer-events-none block h-4 w-4 rounded-full bg-white ring-0 transition-transform data-[state=checked]:bg-primary data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  },
})

export type SwitchVariants = VariantProps<typeof switchStyles>
