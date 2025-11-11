import { tv, type VariantProps } from 'tailwind-variants'

export const switchStyles = tv({
  slots: {
    base:
      'peer border-switch-border bg-switch-bg-active inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-none ' +
      'focus-visible:ring-offset-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-switch-bg-inactive p-0.5',
    thumb: 'switch-shadow pointer-events-none block h-3 w-3 rounded-full bg-white ring-0 transition-transform  data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
  },
})

export type SwitchVariants = VariantProps<typeof switchStyles>
