'use client'

import { signOut, useSession } from 'next-auth/react'
import { userMenuStyles } from './user-menu.styles'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import Link from 'next/link'
import { ChevronDown } from '@repo/ui/icons/chevron-down'
import { useTheme } from 'next-themes'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { Avatar } from '../avatar/avatar'
import { User } from '@repo/codegen/src/schema'
import { BookText, BriefcaseBusiness, Keyboard, LogOut, NotebookPen, Paintbrush, UserRoundCog } from 'lucide-react'
import { DOCS_URL, SUPPORT_EMAIL } from '@/constants'
import { useShortcutSuffix } from '@/components/shared/shortcut-suffix/shortcut-suffix.tsx'

export const UserMenu = () => {
  const { setTheme, theme } = useTheme()
  const { data: sessionData } = useSession()
  const { trigger, email, userSettingsLink, themeRow, themeDropdown, commandRow, commands } = userMenuStyles()
  const userId = sessionData?.user.userId
  const { data } = useGetCurrentUser(userId)
  const { suffix } = useShortcutSuffix()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={trigger()}>
          <Avatar entity={data?.user as User}></Avatar>
          <ChevronDown />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 border shadow-md">
        <div className="text-sm px-2">
          {`${data?.user.displayName}`}
          <br />
          <div className={email()}>{data?.user.email}</div>
        </div>
        <DropdownMenuSeparator spacing="md" className="border-b" />
        <DropdownMenuItem asChild>
          <Link href="/user-settings/profile" className={userSettingsLink()}>
            <UserRoundCog className="text-input-text" size={14} />
            <p>User Settings</p>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/organization" className={userSettingsLink()}>
            <BriefcaseBusiness className="text-input-text" size={14} />
            <p>My Organizations</p>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator spacing="md" className="border-b" />

        <div className={themeRow()}>
          <div className={userSettingsLink()}>
            <Paintbrush size={14} />
            <p>Theme</p>
          </div>
          <Select onValueChange={(value) => setTheme(value)} value={theme}>
            <SelectTrigger className={themeDropdown()}>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent className="bg-panel">
              <SelectGroup>
                <SelectItem value="system">Default</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenuSeparator spacing="md" className="border-b" />

        <DropdownMenuItem asChild>
          <Link href={SUPPORT_EMAIL} className={userSettingsLink()}>
            <NotebookPen className="text-input-text" size={14} />
            Feedback
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={userSettingsLink()}>
            <BookText className="text-input-text" size={14} />
            Docs
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator spacing="md" className="border-b" />
        <div className={commandRow()}>
          <Keyboard size={14} />
          <p>Command menu</p>
          <div className={commands()}>
            <span className="text-[10px]">{suffix}</span>
            <span>K</span>
          </div>
        </div>
        <div className={commandRow()}>
          <Keyboard size={14} />
          <p>Search menu</p>
          <div className={commands()}>
            <span className="text-[10px]">{suffix}</span>
            <span>/</span>
          </div>
        </div>
        <DropdownMenuSeparator spacing="md" className="border-b" />

        <Button
          size="md"
          variant="outline"
          full
          onClick={() => {
            signOut()
          }}
        >
          <div className="flex gap-1 items-center">
            <LogOut size={16} />
            <span>Log out</span>
          </div>
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
