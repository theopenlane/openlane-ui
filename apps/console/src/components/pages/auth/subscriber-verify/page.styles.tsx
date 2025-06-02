import { tv, type VariantProps } from 'tailwind-variants'

const verificationStyles = tv({
  slots: {
    errorMessage: 'mt-14',
    success: 'mt-14 bg-opacity-20 p-5 rounded-md flex flex-col justify-center gap-3 items-center',
    successIcon: 'mt-1',
    loading: 'mt-14 p-5 rounded-md flex gap-3 justify-center items-center',
  },
})

export type VerificationVariants = VariantProps<typeof verificationStyles>

export { verificationStyles }
