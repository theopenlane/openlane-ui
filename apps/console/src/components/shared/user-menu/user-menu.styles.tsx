import { tv, type VariantProps } from 'tailwind-variants'

const userMenuStyles = tv({
  slots: {
    trigger: 'flex items-center gap-2 cursor-pointer',
    email: 'text-accent-secondary',
    userSettingsLink: 'flex items-center gap-2',
    themeRow: 'px-2 flex justify-between text-sm items-center',
    themeToggle: 'ml-auto',
    themeDropdown: 'max-w-[110px]',
    commandRow: 'px-2 flex justify-between items-center text-sm mb-5',
    commands: 'ml-auto flex justify-between text-sm gap-1',
  },
})

export type UserMenuVariants = VariantProps<typeof userMenuStyles>

export { userMenuStyles }
