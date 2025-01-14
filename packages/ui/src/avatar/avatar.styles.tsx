import { tv, type VariantProps } from 'tailwind-variants'

export const avatarStyles = tv({
  slots: {
    avatarImageWrap: 'relative flex h-8 w-8 shrink-0 overflow-hidden border-none rounded-full p-0',
    avatarImage: 'aspect-square h-full w-full',
    avatarFallBack: 'uppercase flex h-full w-full items-center justify-center bg-button text-button-text rounded-md',
  },
  variants: {
    size: {
      small: {
        avatarImageWrap: 'h-[20px] w-[20px]',
      },
      medium: {
        avatarImageWrap: 'h-10 w-10',
      },
      large: {
        avatarImageWrap: 'h-14 w-14',
      },
      'extra-large': {
        avatarImageWrap: 'h-[72px] w-[72px]',
      },
    },
    default: {
      variant: 'medium',
    },
  },
})

export type AvatarVariants = VariantProps<typeof avatarStyles>
