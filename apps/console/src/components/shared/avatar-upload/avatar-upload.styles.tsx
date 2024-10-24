import { tv, type VariantProps } from 'tailwind-variants'

const avatarUploadStyles = tv({
  slots: {
    wrapper:
      'relative rounded border-dashed border border-java-800/40 py-5 px-[110px] text-center h-[109px] flex items-center justify-center transition ease-in',
    cropContainer: 'relative h-[350px]',
    avatarPreview: 'absolute left-5',
  },
  variants: {
    isDragActive: {
      true: {
        wrapper: 'border-java-800',
      },
    },
  },
})

export type AvatarUploadVariants = VariantProps<typeof avatarUploadStyles>

export { avatarUploadStyles }
