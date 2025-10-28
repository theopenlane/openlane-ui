'use client'

import { signOut, useSession } from 'next-auth/react'
import { userMenuStyles } from './user-menu.styles'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator } from '@repo/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { Avatar } from '../avatar/avatar'
import { User } from '@repo/codegen/src/schema'
import { Computer, Keyboard, LogOut, Moon, PaintbrushVertical, Sun, TextSearch, UserCog } from 'lucide-react'
import { useShortcutSuffix } from '@/components/shared/shortcut-suffix/shortcut-suffix.tsx'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const UserMenu = () => {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { data: sessionData } = useSession()
  const { trigger, email } = userMenuStyles()
  const userId = sessionData?.user.userId
  const { data } = useGetCurrentUser(userId)
  const [open, setOpen] = useState(false)
  const { suffix } = useShortcutSuffix()
  const themeOptions = [
    { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
    { value: 'light', icon: <Sun size={14} />, label: 'Light' },
    { value: 'system', icon: <Computer size={14} />, label: 'System' },
  ]

  const handleSettingsRedirect = () => {
    setOpen(false)
    router.push('/user-settings/profile')
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div className={trigger()}>
          <Avatar entity={data?.user as User}></Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 border shadow-md pb-1" align="end">
        <div className="text-sm px-2 text-paragraph">
          {`${data?.user.displayName}`}
          <br />
          <div className={email() + ' text-muted-foreground'}>{data?.user.email}</div>
        </div>
        <DropdownMenuSeparator spacing="md" className="border-b mt-4 mb-1" />

        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-1">
            <PaintbrushVertical size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium">Theme</p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-popover bg-card p-1 border">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center justify-center rounded-md p-1 transition-all bg-popover hover:bg-card dark:bg-card dark:hover:bg-btn-secondary ${
                  theme === opt.value ? '!bg-card dark:!bg-btn-secondary' : 'text-muted-foreground'
                }`}
                title={opt.label}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator spacing="md" className="border-b mt-1 mb-1" />

        <Button size="md" variant="transparent" full className="justify-start gap-1 pl-2" onClick={() => handleSettingsRedirect()}>
          <UserCog size={16} className="text-muted-foreground" />
          <span>User Settings</span>
        </Button>

        <DropdownMenuSeparator spacing="md" className="border-b mt-1 mb-1" />

        <div className="flex items-center justify-between pl-2 mt-3">
          <div className="flex items-center gap-1">
            <Keyboard size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium">Command Menu</p>
          </div>

          <div className="flex items-center gap-1 rounded-sm bg-popover bg-card pr-1 pl-1 border">
            <span className="text-[10px]">{suffix}</span>
            <span className="text-[12px]">K</span>
          </div>
        </div>

        <div className="flex items-center justify-between pl-2 mt-3">
          <div className="flex items-center gap-1">
            <TextSearch size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium">Search Menu</p>
          </div>

          <div className="flex items-center gap-1 rounded-sm bg-popover bg-card pr-1 pl-1 border">
            <span className="text-[10px]">{suffix}</span>
            <span className="text-[12px]">/</span>
          </div>
        </div>

        <DropdownMenuSeparator spacing="md" className="border-b mt-1 mb-1 mt-3" />

        <Button size="md" variant="transparent" full className="justify-start gap-1 pl-2" onClick={() => signOut()}>
          <LogOut size={16} className="text-muted-foreground" />
          <span>Log out</span>
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
