import { EVIDENCE_EXTENSION_PUBLIC_KEY } from '@repo/evidence-capture/connect'
import { CAPTURE_SOURCE_NAME } from '@repo/evidence-capture/provenance'

type TManifestInput = {
  version: string
  consoleOrigin: string
  apiOrigin: string
}

const ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
}

export const buildManifest = ({ version, consoleOrigin, apiOrigin }: TManifestInput): chrome.runtime.ManifestV3 => ({
  manifest_version: 3,
  name: CAPTURE_SOURCE_NAME,
  minimum_chrome_version: '116',
  description: 'Capture screenshots of any page and upload them to Openlane as evidence, with capture provenance.',
  version,
  key: EVIDENCE_EXTENSION_PUBLIC_KEY,
  icons: ICONS,
  action: {
    default_popup: 'popup.html',
    default_title: 'Capture evidence with Openlane',
    default_icon: ICONS,
  },
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  permissions: ['activeTab', 'storage'],
  host_permissions: [`${apiOrigin}/*`],
  externally_connectable: {
    matches: [`${consoleOrigin}/*`],
  },
})
