import { CAPTURE_SOURCE_NAME, captureProvenanceSchema, toSha256Hex } from '@repo/evidence-capture/provenance'
import type { TCaptureProvenance } from '@repo/evidence-capture/provenance'
import { fetchServerDate } from './api'
import type { TConnection } from './connection'
import { composeWithFooter, formatFooterTimestamp } from './footer'

export type TCaptureTarget = {
  windowId: number
  url: URL
  title: string
}

export type TCapture = {
  file: File
  previewUrl: string
  provenance: TCaptureProvenance
}

const PNG_MIME_TYPE = 'image/png'

export const EXTENSION_VERSION = chrome.runtime.getManifest().version
export const CAPTURE_SOURCE_LABEL = `${CAPTURE_SOURCE_NAME} v${EXTENSION_VERSION}`

const captureFileName = (hostname: string, capturedAt: string) => `openlane-capture-${hostname}-${capturedAt.replace(/[:.]/g, '-')}.png`

const captureScreenshot = async (windowId: number) => {
  const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' })
  return createImageBitmap(await (await fetch(dataUrl)).blob())
}

export const captureVisibleTab = async (connection: TConnection, target: TCaptureTarget): Promise<TCapture> => {
  const clientCapturedAt = new Date()
  const [serverDate, screenshot] = await Promise.all([fetchServerDate(), captureScreenshot(target.windowId)])

  const capturedAt = (serverDate ?? clientCapturedAt).toISOString()
  const blob = await composeWithFooter(screenshot, {
    timestamp: formatFooterTimestamp(capturedAt),
    location: `${target.url.hostname}${target.url.pathname}`,
    captureSource: CAPTURE_SOURCE_LABEL,
  })
  const viewport = { width: screenshot.width, height: screenshot.height, device_pixel_ratio: window.devicePixelRatio }
  screenshot.close()

  const file = new File([blob], captureFileName(target.url.hostname, capturedAt), { type: PNG_MIME_TYPE })
  const provenance = captureProvenanceSchema.parse({
    schema_version: 1,
    capture_type: 'browser_screenshot',
    captured_at: capturedAt,
    captured_at_source: serverDate ? 'server' : 'client',
    client_captured_at: clientCapturedAt.toISOString(),
    source_url: `${target.url.origin}${target.url.pathname}`,
    source_domain: target.url.hostname,
    page_title: target.title,
    collector: connection.collector.id,
    collector_email: connection.collector.email,
    organization_id: connection.organizationId,
    capture_source: CAPTURE_SOURCE_LABEL,
    extension_version: EXTENSION_VERSION,
    user_agent: navigator.userAgent,
    viewport,
    artifact_sha256: await toSha256Hex(await file.arrayBuffer()),
    artifact_mime_type: PNG_MIME_TYPE,
    artifact_size_bytes: file.size,
  } satisfies TCaptureProvenance)

  return { file, previewUrl: URL.createObjectURL(file), provenance }
}
