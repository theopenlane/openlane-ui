import { CircleCheckBig, CircleDot, CirclePlus, FolderPen, Key, MonitorCheckIcon, ScanIcon, UserRoundCheck, type LucideIcon } from 'lucide-react'
import { TaskTaskStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { Button } from '@repo/ui/button'

export enum AssetsFilterIconName {
  DisplayID = 'DisplayID',
  Name = 'Name',
  Environment = 'Environment',
  Scope = 'Scope',
}

export const FilterIcons: Record<AssetsFilterIconName, LucideIcon> = {
  [AssetsFilterIconName.DisplayID]: Key,
  [AssetsFilterIconName.Name]: FolderPen,
  [AssetsFilterIconName.Environment]: MonitorCheckIcon,
  [AssetsFilterIconName.Scope]: ScanIcon,
}

export const AssetIconBtn = (
  <div className="flex items-center space-x-2">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Asset</span>
  </div>
)
export const AssetIconPrefixBtn = (
  <Button size="sm" variant="transparent" className="flex items-center space-x-2 justify-start">
    <CircleCheckBig size={16} strokeWidth={2} />
    <span>Create Asset</span>
  </Button>
)
