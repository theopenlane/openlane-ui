import { LOGO_MARK_BACKGROUND_PATH, LOGO_MARK_FOREGROUND_PATH, LOGO_MARK_VIEWBOX } from '@repo/ui/logo-mark'

const FOOTER_COLORS = {
  bar: '#09151d',
  text: '#ffffff',
  separator: 'rgba(255, 255, 255, 0.35)',
  muted: 'rgba(255, 255, 255, 0.75)',
  logoBackground: '#ffffff',
  logoForeground: '#4dc6ad',
}

const FONT_FAMILY = 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif'

export type TFooterContent = {
  timestamp: string
  location: string
  captureSource: string
}

export const formatFooterTimestamp = (iso: string) => `${iso.slice(0, 19).replace('T', ' ')} UTC`

const truncateToWidth = (context: OffscreenCanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (context.measureText(text).width <= maxWidth) {
    return text
  }
  let low = 0
  let high = text.length
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (context.measureText(`${text.slice(0, middle)}…`).width <= maxWidth) {
      low = middle
    } else {
      high = middle - 1
    }
  }
  return `${text.slice(0, low)}…`
}

const drawLogoMark = (context: OffscreenCanvasRenderingContext2D, x: number, y: number, height: number) => {
  const scale = height / LOGO_MARK_VIEWBOX.height
  context.save()
  context.translate(x, y)
  context.scale(scale, scale)
  context.fillStyle = FOOTER_COLORS.logoBackground
  context.fill(new Path2D(LOGO_MARK_BACKGROUND_PATH))
  context.fillStyle = FOOTER_COLORS.logoForeground
  context.fill(new Path2D(LOGO_MARK_FOREGROUND_PATH))
  context.restore()
  return LOGO_MARK_VIEWBOX.width * scale
}

export const composeWithFooter = async (screenshot: ImageBitmap, content: TFooterContent): Promise<Blob> => {
  const footerHeight = Math.round(Math.max(44, screenshot.width * 0.03))
  const canvas = new OffscreenCanvas(screenshot.width, screenshot.height + footerHeight)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.')
  }

  context.drawImage(screenshot, 0, 0)

  const top = screenshot.height
  const padding = footerHeight * 0.45
  const gap = footerHeight * 0.4
  const fontSize = Math.round(footerHeight * 0.36)
  const baseline = top + footerHeight / 2

  context.fillStyle = FOOTER_COLORS.bar
  context.fillRect(0, top, canvas.width, footerHeight)

  const logoHeight = footerHeight * 0.5
  let cursor = padding + drawLogoMark(context, padding, baseline - logoHeight / 2, logoHeight) + gap

  context.textBaseline = 'middle'
  context.font = `600 ${fontSize}px ${FONT_FAMILY}`
  const sourceWidth = context.measureText(content.captureSource).width
  context.fillStyle = FOOTER_COLORS.text
  context.fillText(content.captureSource, canvas.width - padding - sourceWidth, baseline)

  context.font = `500 ${fontSize}px ${FONT_FAMILY}`
  context.fillText(content.timestamp, cursor, baseline)
  cursor += context.measureText(content.timestamp).width + gap

  const separator = (x: number) => {
    context.fillStyle = FOOTER_COLORS.separator
    context.fillRect(x, baseline - fontSize * 0.6, Math.max(1, footerHeight * 0.03), fontSize * 1.2)
  }
  separator(cursor)
  cursor += gap

  const locationMaxWidth = canvas.width - padding - sourceWidth - gap * 2 - cursor
  context.fillStyle = FOOTER_COLORS.muted
  context.font = `400 ${fontSize}px ${FONT_FAMILY}`
  context.fillText(truncateToWidth(context, content.location, locationMaxWidth), cursor, baseline)
  separator(canvas.width - padding - sourceWidth - gap)

  return canvas.convertToBlob({ type: 'image/png' })
}
