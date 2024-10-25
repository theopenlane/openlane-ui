import { tv, type VariantProps } from 'tailwind-variants'

export const logoStyles = tv({
  slots: {
    base: 'block max-w-full max-h-full',
    icon: 'fill-aquamarine-400',
    iconBackground: 'fill-river-bed-700',
    text: 'fill-river-bed-700',
  },
  variants: {
    theme: {
      light: {
        icon: 'fill-aquamarine-400',
        iconBackground: 'fill-river-bed-700',
        text: 'fill-river-bed-700',
      },
      dark: {
        icon: 'fill-aquamarine-400',
        iconBackground: 'fill-river-bed-700',
        text: 'fill-ziggurat-200',
      },
      white: {
        icon: 'fill-aquamarine-400',
        iconBackground: 'fill-white',
        text: 'fill-white',
      },
    },
  },
})

export type LogoVariants = VariantProps<typeof logoStyles>
