import { tv, type VariantProps } from 'tailwind-variants'

export const logoStyles = tv({
  slots: {
    base: 'block max-w-full max-h-full',
    icon: 'fill-logo-foreground',
    iconBackground: 'fill-logo-background',
    text: 'fill-logo-text'
  },
  variants: {
    theme: {
      light: {
        text: 'fill-logo-dark',
      },
      dark: {
        text: 'fill-logo-light',
      },
      white: {
        iconBackground: 'fill-white',
        text: 'fill-white',
      },
    },
  },
})

export type LogoVariants = VariantProps<typeof logoStyles>
