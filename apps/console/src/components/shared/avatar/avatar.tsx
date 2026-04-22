import { type Entity, type Group, type Organization, type User } from '@repo/codegen/src/schema'
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { toBase64DataUri } from '@/utils/toBase64DataUri'

interface AvatarProps {
  entity?: User | Organization | Group | Entity | null
  variant?: 'small' | 'medium' | 'large' | 'extra-large'
  className?: string
}

export function Avatar({ variant, entity, className }: AvatarProps) {
  if (!entity) return null

  const image = (() => {
    if ('avatarFile' in entity && entity.avatarFile) {
      if ('base64' in entity.avatarFile && entity.avatarFile.base64) {
        return toBase64DataUri(entity.avatarFile.base64)
      }
      if ('presignedURL' in entity.avatarFile && entity.avatarFile.presignedURL) {
        return entity.avatarFile.presignedURL
      }
    }
    if ('logoFile' in entity && entity.logoFile) {
      if ('base64' in entity.logoFile && entity.logoFile.base64) {
        return toBase64DataUri(entity.logoFile.base64)
      }
    }
    if ('avatarRemoteURL' in entity) return entity.avatarRemoteURL
    if ('gravatarLogoURL' in entity) return entity.gravatarLogoURL
    if ('logoURL' in entity) return entity.logoURL
    return undefined
  })()

  const fallbackText = entity.displayName?.substring(0, variant === 'small' ? 1 : 2)

  return (
    <AvatarComponent variant={variant} className={className}>
      {image && <AvatarImage src={image} />}
      <AvatarFallback>{fallbackText || 'N/A'}</AvatarFallback>
    </AvatarComponent>
  )
}
