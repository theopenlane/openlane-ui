import React from 'react'
import ObjectAssociationCircle from '@/assets/ObjectAssociationCircle.tsx'

const ObjectAssociationPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center relative">
      <ObjectAssociationCircle className="text-border" triangleClassName="text-border-light" />
      <div className="absolute flex flex-col items-center mt-[120px]">
        <p className="text-md font-semibold leading-6">Please select an object first</p>
        <p className="text-sm font-normal">List of objects you&apos;ll select will be displayed here</p>
      </div>
    </div>
  )
}

export default ObjectAssociationPlaceholder
