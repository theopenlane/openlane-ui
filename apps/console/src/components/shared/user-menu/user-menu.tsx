'use client'

import { signOut, useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { userMenuStyles } from './user-menu.styles'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import Link from 'next/link'
import { ChevronDown } from '@repo/ui/icons/chevron-down'
import { Kbd } from '@repo/ui/kbd'
import { useTheme } from 'next-themes'
import { GetUserProfileQueryVariables, useGetUserProfileQuery } from '@repo/codegen/src/schema'

export const UserMenu = () => {
  const { setTheme, theme } = useTheme()
  const { data: sessionData } = useSession()
  const { trigger, email, userSettingsLink, themeRow, themeDropdown, commandRow, commands } = userMenuStyles()

  const userId = sessionData?.user.userId

  const variables: GetUserProfileQueryVariables = {
    userId: userId ?? '',
  }

  const [{ data: userData }] = useGetUserProfileQuery({
    variables,
  })

  const image = userData?.user.avatarFile?.presignedURL || userData?.user?.avatarRemoteURL
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={trigger()}>
          <Avatar>
            {image && <AvatarImage src={image} />}
            <AvatarFallback>{sessionData?.user?.name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <ChevronDown />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64">
        <DropdownMenuItem asChild>
          <div>
            <div>
              <div>
                {`${userData?.user.firstName} ${userData?.user.lastName}`}
                <br />
                <div className={email()}>{userData?.user.email}</div>
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
            <Kbd text="⌘" size="small" />
            <Kbd text="K" size="small" />
          </div>
        </div>
        <div className={commandRow()}>
          <p>Search menu</p>
          <div className={commands()}>
            <Kbd text="⌘" size="small" />
            <Kbd text="/" size="small" />
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
