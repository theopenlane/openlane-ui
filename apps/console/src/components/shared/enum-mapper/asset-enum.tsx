import { Box, CircuitBoard, FolderGit2, Globe, Phone, Server, type LucideIcon } from 'lucide-react'
import { AssetAssetType } from '@repo/codegen/src/schema'

const ASSET_TYPE_ICONS: Record<AssetAssetType, LucideIcon> = {
  [AssetAssetType.DEVICE]: Server,
  [AssetAssetType.DOMAIN]: Globe,
  [AssetAssetType.REPOSITORY]: FolderGit2,
  [AssetAssetType.TECHNOLOGY]: CircuitBoard,
  [AssetAssetType.TELEPHONE]: Phone,
}

type TAssetTypeIconProps = { assetType: AssetAssetType; size?: number; className?: string }

export const AssetTypeIcon = ({ assetType, size = 16, className }: TAssetTypeIconProps) => {
  const Icon = ASSET_TYPE_ICONS[assetType] ?? Box
  return <Icon size={size} className={className} aria-hidden />
}
