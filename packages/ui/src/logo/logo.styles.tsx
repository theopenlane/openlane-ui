import { tv, type VariantProps } from 'tailwind-variants'

export const logoStyles = tv({
  slots: {
    base: 'block max-w-full max-h-full',
    icon: 'fill-teal-400',
    iconBackground: 'fill-neutral-700',
    text: 'fill-text-paragraph'
  },
  variants: {
    theme: {
      light: {
        text: 'fill-neutral-700',
      },
      dark: {
        text: 'fill-neutral-100',
      },
      white: {
        iconBackground: 'fill-white',
        text: 'fill-white',
      },
    },
  },
})

export type LogoVariants = VariantProps<typeof logoStyles>
