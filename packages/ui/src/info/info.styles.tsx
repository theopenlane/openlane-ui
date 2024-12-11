import { tv, type VariantProps } from 'tailwind-variants'

export const infoStyles = tv({
  slots: {
    panel: 'flex py-3 px-4 gap-4 rounded font-sans items-center',
  },
  variants: {
    style: {
      info: {
        panel: 'bg-java-50 text-java-600 dark:bg-java-900 dark:text-java-300',
      },
    },
  },
  defaultVariants: {
    style: 'info',
  },
})

export type InfoVariants = VariantProps<typeof infoStyles>
