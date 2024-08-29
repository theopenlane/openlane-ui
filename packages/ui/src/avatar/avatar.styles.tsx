import { tv, type VariantProps } from 'tailwind-variants'

export const avatarStyles = tv({
  slots: {
    avatarImageWrap:
      'relative flex h-11 w-11 shrink-0 overflow-hidden border-none rounded-md p-0 bg-blackberry-700',
    avatarImage: 'aspect-square h-full w-full',
    avatarFallBack:
      'uppercase flex h-full w-full items-center justify-center rounded-md bg-sunglow-900 text-white',
  },
  variants: {
    size: {
      medium: {
        avatarImageWrap: 'h-[34px] w-[34px]',
      },
      large: {
        avatarImageWrap: 'h-14 w-14',
      },
      'extra-large': {
        avatarImageWrap: 'h-[72px] w-[72px]',
      },
    },
  },
})

export type AvatarVariants = VariantProps<typeof avatarStyles>
