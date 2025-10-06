import { tv, type VariantProps } from 'tailwind-variants'

export const logoStyles = tv({
  slots: {
    base: 'block max-w-full max-h-full',
    icon: 'fill-[var(--color-logo-fg)]',
    iconBackground: 'fill-[var(--color-logo-bg)]',
    text: 'fill-[var(--color-logo-text)]',
  },
  variants: {
    theme: {
      light: {
        text: 'fill-[var(--color-logo-dark)]',
      },
      dark: {
        text: 'fill-[var(--color-logo-light)]',
      },
      white: {
        iconBackground: 'fill-white',
        text: 'fill-white',
      },
    },
  },
})

export type LogoVariants = VariantProps<typeof logoStyles>
