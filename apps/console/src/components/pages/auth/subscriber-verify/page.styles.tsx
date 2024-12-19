import { tv, type VariantProps } from 'tailwind-variants'

const verificationStyles = tv({
  slots: {
    errorMessage: 'text-oxford-blue-200 mt-14',
    success:
      'mt-14 bg-white bg-opacity-20 p-5 rounded-md text-white flex gap-3',
    successMessage: 'flex-1',
    successIcon: 'mt-1',
    loading: 'mt-14 p-5 rounded-md text-white flex gap-3',
  },
})

export type VerificationVariants = VariantProps<typeof verificationStyles>

export { verificationStyles }