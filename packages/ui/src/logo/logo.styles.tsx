import { tv, type VariantProps } from 'tailwind-variants'

export const logoStyles = tv({
  slots: {
    base: 'block max-w-full max-h-full',
    icon: 'fill-aquamarine-900',
    text: 'fill-java-800 dark:fill-white',
  },
  variants: {
    theme: {
      light: {
        icon: 'fill-aquamarine-900',
        text: 'fill-java-800 dark:fill-java-800',
      },
      dark: {
        icon: 'fill-aquamarine-900',
        text: 'fill-white',
      },
      java: {
        icon: 'fill-java-800',
        text: 'fill-java-800',
      },
      javaLight: {
        icon: 'fill-java-700',
        text: 'fill-java-700',
      },
      aquamarine: {
        icon: 'fill-aquamarine-400',
        text: 'fill-aquamarine-400',
      },
      white: {
        icon: 'fill-white',
        text: 'fill-white',
      },
    },
  },
})

export type LogoVariants = VariantProps<typeof logoStyles>
