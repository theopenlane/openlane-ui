import { Group, Organization, User } from '@repo/codegen/src/schema'
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

interface AvatarProps {
  entity?: User | Organization | Group | null
  variant?: 'small' | 'medium' | 'large' | 'extra-large'
  className?: string
}

export function Avatar({ variant, entity, className }: AvatarProps) {
  if (!entity) return null

  const image =
    'avatarFile' in entity ? entity.avatarFile?.presignedURL || entity.avatarRemoteURL : 'gravatarLogoURL' in entity || 'logoURL' in entity ? entity.gravatarLogoURL || entity.logoURL : undefined

  const fallbackText = entity.displayName?.substring(0, variant === 'small' ? 1 : 2)

  return (
    <AvatarComponent variant={variant} className={className}>
      {image && <AvatarImage src={image} />}
      <AvatarFallback>{fallbackText || 'N/A'}</AvatarFallback>
    </AvatarComponent>
  )
}
