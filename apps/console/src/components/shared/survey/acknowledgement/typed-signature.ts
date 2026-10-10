import { signatureFontFamilies } from '@/fonts/signature'
import { SIGNATURE_PAD_HEIGHT, SIGNATURE_PAD_WIDTH } from '../signature-pad/signature-pad-type'
import { TYPED_SIGNATURE_PREFIX } from './acknowledgement-type'

const SIGNATURE_PIXEL_RATIO = 2
const SIGNATURE_PADDING_X = 40
const MAX_FONT_SIZE = 96
const MIN_FONT_SIZE = 24
const SVG_ATTRIBUTES = ` xmlns="http://www.w3.org/2000/svg" width="${SIGNATURE_PAD_WIDTH}" height="${SIGNATURE_PAD_HEIGHT}" viewBox="0 0 ${SIGNATURE_PAD_WIDTH} ${SIGNATURE_PAD_HEIGHT}"><image href="`
const SVG_CLOSE = `" width="${SIGNATURE_PAD_WIDTH}" height="${SIGNATURE_PAD_HEIGHT}"/></svg>`

export const TYPED_SIGNATURE_STYLE_COUNT = signatureFontFamilies.length

const fitFontSize = (context: CanvasRenderingContext2D, name: string, fontFamily: string) => {
  context.font = `${MAX_FONT_SIZE}px ${fontFamily}`
  const { actualBoundingBoxLeft, actualBoundingBoxRight } = context.measureText(name)
  const width = actualBoundingBoxLeft + actualBoundingBoxRight
  const fitted = width > 0 ? (MAX_FONT_SIZE * (SIGNATURE_PAD_WIDTH - 2 * SIGNATURE_PADDING_X)) / width : MAX_FONT_SIZE
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fitted))
}

export const renderTypedSignature = async (name: string, styleIndex: number, inkColor: string): Promise<string> => {
  const fontFamily = signatureFontFamilies[styleIndex]
  await document.fonts.load(`${MAX_FONT_SIZE}px ${fontFamily}`, name)

  const canvas = document.createElement('canvas')
  canvas.width = SIGNATURE_PAD_WIDTH * SIGNATURE_PIXEL_RATIO
  canvas.height = SIGNATURE_PAD_HEIGHT * SIGNATURE_PIXEL_RATIO
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')

  context.scale(SIGNATURE_PIXEL_RATIO, SIGNATURE_PIXEL_RATIO)
  context.font = `${fitFontSize(context, name, fontFamily)}px ${fontFamily}`
  context.fillStyle = inkColor
  const { actualBoundingBoxLeft, actualBoundingBoxRight, actualBoundingBoxAscent, actualBoundingBoxDescent } = context.measureText(name)
  const x = (SIGNATURE_PAD_WIDTH - actualBoundingBoxLeft - actualBoundingBoxRight) / 2 + actualBoundingBoxLeft
  const y = (SIGNATURE_PAD_HEIGHT + actualBoundingBoxAscent - actualBoundingBoxDescent) / 2
  context.fillText(name, x, y)

  return `${TYPED_SIGNATURE_PREFIX}${encodeURIComponent(SVG_ATTRIBUTES)}${canvas.toDataURL('image/png')}${encodeURIComponent(SVG_CLOSE)}`
}
