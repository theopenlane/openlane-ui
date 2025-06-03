import { tv, type VariantProps } from 'tailwind-variants'

const verificationStyles = tv({
  slots: {
    messageWrapper: 'mt-14 p-5 flex gap-6 bg-card rounded-lg items-center mx-2',
    loading: 'mt-14 p-5 rounded-md flex gap-3 justify-center items-center',
  },
})

export type VerificationVariants = VariantProps<typeof verificationStyles>

export { verificationStyles }
