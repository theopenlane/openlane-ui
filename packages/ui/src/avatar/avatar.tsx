'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '../../lib/utils'
import { avatarStyles, AvatarVariants } from './avatar.styles'

const { avatarImage, avatarFallBack } = avatarStyles()

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  variant?: AvatarVariants['size']
}

const Avatar = ({ className, variant, ref, ...props }: AvatarProps & { ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>> }) => {
  const styles = avatarStyles({ size: variant })
  return <AvatarPrimitive.Root ref={ref} className={cn(styles.avatarImageWrap(), className)} {...props} />
}

const AvatarImage = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & { ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>> }) => (
  <AvatarPrimitive.Image ref={ref} className={cn(avatarImage(), className)} {...props} />
)

const AvatarFallback = ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>> }) => (
  <AvatarPrimitive.Fallback ref={ref} className={cn(avatarFallBack(), className)} {...props} />
)

export { Avatar, AvatarImage, AvatarFallback }
