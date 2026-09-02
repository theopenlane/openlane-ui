import { type Entity, type Group, type Organization, type User } from '@repo/codegen/src/schema'
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { toBase64DataUri } from '@/lib/image-utils'

export type AvatarEntityLike = {
  displayName?: string | null
  avatarRemoteURL?: string | null
  gravatarLogoURL?: string | null
  logoURL?: string | null
  avatarFile?: { base64?: string | null } | null
  logoFile?: { base64?: string | null } | null
}

interface AvatarProps {
  entity?: User | Organization | Group | Entity | AvatarEntityLike | null
  variant?: 'small' | 'medium' | 'large' | 'extra-large'
  className?: string
}

export const getAvatarImageSrc = (entity?: AvatarEntityLike | null): string | undefined => {
  if (!entity) return undefined

  if (entity.avatarFile?.base64) return toBase64DataUri(entity.avatarFile.base64)
  if (entity.logoFile?.base64) return toBase64DataUri(entity.logoFile.base64)

  return entity.avatarRemoteURL || entity.gravatarLogoURL || entity.logoURL || undefined
}

export const Avatar = ({ variant, entity, className }: AvatarProps) => {
  if (!entity) return null

  const image = getAvatarImageSrc(entity)
  const fallbackText = entity.displayName?.substring(0, variant === 'small' ? 1 : 2)

  return (
    <AvatarComponent variant={variant} className={className}>
      {image && <AvatarImage src={image} />}
      <AvatarFallback>{fallbackText || 'N/A'}</AvatarFallback>
    </AvatarComponent>
  )
}
