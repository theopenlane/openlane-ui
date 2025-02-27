import { UserInfoFragment } from '@repo/codegen/src/schema'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

export function UserAvatar({ user }: { user: UserInfoFragment }) {
  if (!user) return null
  const image = user.avatarFile?.presignedURL || user.avatarRemoteURL
  return (
    <Avatar variant="small">
      {image && <AvatarImage src={image} />}
      <AvatarFallback>{user.firstName?.substring(0, 1)}</AvatarFallback>
    </Avatar>
  )
}
