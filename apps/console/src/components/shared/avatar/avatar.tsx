import { Organization, User } from '@repo/codegen/src/schema'
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

interface AvatarProps {
  entity?: User | Organization | null
  variant?: 'small' | 'medium' | 'large' | 'extra-large'
  className?: string
}

export function Avatar({ variant, entity, className }: AvatarProps) {
  if (!entity) {
    return null
  }

  const image = entity.avatarFile?.presignedURL || entity.avatarRemoteURL
  const fallbackText = entity.hasOwnProperty('firstName')
    ? (entity as User).firstName?.substring(0, variant === 'small' ? 1 : 2) // Handle user
    : (entity as Organization).displayName?.substring(0, variant === 'small' ? 1 : 2) // Handle organization

  return (
    <AvatarComponent variant={variant} className={className}>
      {image && <AvatarImage src={image} />}
      <AvatarFallback>{fallbackText || 'N/A'}</AvatarFallback>
    </AvatarComponent>
  )
}
