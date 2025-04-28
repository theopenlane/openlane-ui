'use client'

import { signOut, useSession } from 'next-auth/react'
import { userMenuStyles } from './user-menu.styles'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import Link from 'next/link'
import { ChevronDown } from '@repo/ui/icons/chevron-down'
import { Kbd } from '@repo/ui/kbd'
import { useTheme } from 'next-themes'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { Avatar } from '../avatar/avatar'
import { User } from '@repo/codegen/src/schema'
import { useShortcutSuffix } from '@/components/shared/shortcut-suffix/shortcut-suffix.tsx'

export const UserMenu = () => {
  const { setTheme, theme } = useTheme()
  const { data: sessionData } = useSession()
  const { trigger, email, userSettingsLink, themeRow, themeDropdown, commandRow, commands } = userMenuStyles()
  const userId = sessionData?.user.userId
  const { data } = useGetCurrentUser(userId)
  const { suffix, sign } = useShortcutSuffix()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={trigger()}>
          <Avatar entity={data?.user as User}></Avatar>
          <ChevronDown />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64">
        <DropdownMenuItem asChild>
          <div>
            <div>
              <div>
                {`${data?.user.firstName} ${data?.user.lastName}`}
                <br />
                <div className={email()}>{data?.user.email}</div>
              </div>
              <div>
                <Link href="/user-settings/profile" className={userSettingsLink()}>
                  User Settings
                </Link>
              </div>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator spacing="md" />
        <div className={commandRow()}>
          <p>Command menu</p>
          <div className={commands()}>
            <Kbd text={suffix} size="small" padding="pl-3 pr-3" />
            <Kbd text={sign} size="small" />
          </div>
        </div>
        <div className={commandRow()}>
          <p>Search menu</p>
          <div className={commands()}>
            <Kbd text={suffix} size="small" padding="pl-3 pr-3" />
            <Kbd text={sign} size="small" />
          </div>
        </div>
        <DropdownMenuSeparator spacing="md" />
        <div className={themeRow()}>
          <p>Theme</p>
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
        <DropdownMenuSeparator spacing="md" />
        <DropdownMenuItem>
          <div>
            <Link href="/organization" className={userSettingsLink()}>
              My organizations
            </Link>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator spacing="md" />
        <DropdownMenuItem>
          <Button
            size="md"
            variant="outline"
            full
            onClick={() => {
              signOut()
            }}
          >
            Log out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
