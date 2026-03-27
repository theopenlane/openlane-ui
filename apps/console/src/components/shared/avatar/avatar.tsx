import { type Group, type Organization, type User } from '@repo/codegen/src/schema'
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

interface AvatarProps {
  entity?: User | Organization | Group | null
  variant?: 'small' | 'medium' | 'large' | 'extra-large'
  className?: string
}

const toBase64DataUri = (base64: string): string => {
  if (base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`
  if (base64.startsWith('R0lGOD')) return `data:image/gif;base64,${base64}`
  return `data:image/png;base64,${base64}`
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
