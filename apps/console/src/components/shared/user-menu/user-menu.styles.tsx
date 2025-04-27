import { tv, type VariantProps } from 'tailwind-variants'

const userMenuStyles = tv({
  slots: {
    trigger: 'flex items-center gap-2 cursor-pointer',
    email: 'text-text-light font-medium ',
    userSettingsLink: 'flex items-center gap-2 text-xs',
    themeRow: 'px-2 flex justify-between text-sm items-cente flex-col gap-1',
    themeToggle: 'ml-auto',
    themeDropdown: '',
    commandRow: 'px-2 flex  items-center text-sm mb-2 gap-2.5',
    commands: ' flex  text-sm gap-1 border text-xs px-1 py-0.5 rounded-md',
  },
})

export type UserMenuVariants = VariantProps<typeof userMenuStyles>

export { userMenuStyles }
