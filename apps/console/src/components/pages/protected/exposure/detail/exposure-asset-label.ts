export const exposureAssetLabel = (asset: { name: string; displayName?: string | null } | null) => (asset ? asset.displayName || asset.name : 'No linked asset')
