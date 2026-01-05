import { TrustCenterWatermarkConfigFont } from '@repo/codegen/src/schema'

export const TrustCenterWatermarkConfigFontMapper: Record<TrustCenterWatermarkConfigFont, string> = {
  [TrustCenterWatermarkConfigFont.COURIER]: 'Courier',
  [TrustCenterWatermarkConfigFont.COURIER_BOLD]: 'Courier Bold',
  [TrustCenterWatermarkConfigFont.COURIER_BOLDOBLIQUE]: 'Courier Bold Oblique',
  [TrustCenterWatermarkConfigFont.COURIER_OBLIQUE]: 'Courier Oblique',
  [TrustCenterWatermarkConfigFont.HELVETICA]: 'Helvetica',
  [TrustCenterWatermarkConfigFont.HELVETICA_BOLD]: 'Helvetica Bold',
  [TrustCenterWatermarkConfigFont.HELVETICA_BOLDOBLIQUE]: 'Helvetica Bold Oblique',
  [TrustCenterWatermarkConfigFont.HELVETICA_OBLIQUE]: 'Helvetica Oblique',
  [TrustCenterWatermarkConfigFont.SYMBOL]: 'Symbol',
  [TrustCenterWatermarkConfigFont.TIMES_BOLD]: 'Times New Roman Bold',
  [TrustCenterWatermarkConfigFont.TIMES_BOLDITALIC]: 'Times New Roman Bold Italic',
  [TrustCenterWatermarkConfigFont.TIMES_ITALIC]: 'Times New Roman Italic',
  [TrustCenterWatermarkConfigFont.TIMES_ROMAN]: 'Times New Roman',
}

export const TrustCenterWatermarkConfigFontOptions = Object.values(TrustCenterWatermarkConfigFont).map((status) => ({
  label: status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value: status,
}))
