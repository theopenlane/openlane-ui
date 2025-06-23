import { MappedControlMappingType } from '@repo/codegen/src/schema'
import React from 'react'
import Intersection from '@/assets/Intersection'
import Subset from '@/assets/Subset'
import Equals from '@/assets/Equals'
import Partial from '@/assets/Partial'
import SupersetDark from '@/assets/SupersetDark'
import SupersetLight from '@/assets/SupersetLight '

export const MappingIconMapper: Record<MappedControlMappingType, React.ReactNode> = {
  [MappedControlMappingType.EQUAL]: <Equals />,
  [MappedControlMappingType.INTERSECT]: <Intersection />,
  [MappedControlMappingType.SUBSET]: <Subset />,
  [MappedControlMappingType.PARTIAL]: <Partial />,
  [MappedControlMappingType.SUPERSET]: (
    <>
      <div className="block dark:hidden">
        <SupersetLight />
      </div>
      <div className="hidden dark:block">
        <SupersetDark />
      </div>
    </>
  ),
}
