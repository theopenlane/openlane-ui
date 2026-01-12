import { TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'

export const WatermarkStatusLabels: Record<TrustCenterDocWatermarkStatus, string> = {
  [TrustCenterDocWatermarkStatus.DISABLED]: 'Disabled',
  [TrustCenterDocWatermarkStatus.FAILED]: 'Failed',
  [TrustCenterDocWatermarkStatus.IN_PROGRESS]: 'In progress',
  [TrustCenterDocWatermarkStatus.PENDING]: 'Pending',
  [TrustCenterDocWatermarkStatus.SUCCESS]: 'Success',
}

export const StatusBgClasses: Record<TrustCenterDocWatermarkStatus, string> = {
  DISABLED: 'bg-gray-200 text-gray-700',
  FAILED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-blue-100 text-blue-700',
  SUCCESS: 'bg-green-100 text-green-700',
}
