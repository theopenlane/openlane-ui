import { Box, GitBranch, Globe, Laptop, Phone, Server, type LucideIcon } from 'lucide-react'
import { AssetAssetType } from '@repo/codegen/src/schema'

const ASSET_TYPE_ICONS: Record<AssetAssetType, LucideIcon> = {
  [AssetAssetType.DEVICE]: Laptop,
  [AssetAssetType.DOMAIN]: Globe,
  [AssetAssetType.REPOSITORY]: GitBranch,
  [AssetAssetType.TECHNOLOGY]: Server,
  [AssetAssetType.TELEPHONE]: Phone,
}

type TAssetTypeIconProps = { assetType: AssetAssetType; size?: number; className?: string }

export const AssetTypeIcon = ({ assetType, size = 16, className }: TAssetTypeIconProps) => {
  const Icon = ASSET_TYPE_ICONS[assetType] ?? Box
  return <Icon size={size} className={className} aria-hidden />
}
