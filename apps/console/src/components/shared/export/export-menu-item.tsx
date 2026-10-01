import React from 'react'
import { DownloadIcon, LoaderCircle } from 'lucide-react'
import MenuItem from '@/components/shared/menu/menu-item'
import { type TElementAnchor } from '@/components/shared/element-anchor/element-anchor'

type TExportMenuItemProps = {
  onExport: () => void
  onSelected?: () => void
  isExporting?: boolean
  disabled?: boolean
  label?: string
  icon?: React.ReactNode
  anchor?: TElementAnchor
}

const ExportMenuItem: React.FC<TExportMenuItemProps> = ({ onExport, onSelected, isExporting, disabled, label = 'Export', icon, anchor }) => (
  <MenuItem
    {...anchor}
    icon={isExporting ? <LoaderCircle size={16} strokeWidth={2} className="animate-spin" /> : (icon ?? <DownloadIcon size={16} strokeWidth={2} />)}
    disabled={disabled || isExporting}
    onSelect={() => {
      onExport()
      onSelected?.()
    }}
  >
    {label}
  </MenuItem>
)

export default ExportMenuItem
