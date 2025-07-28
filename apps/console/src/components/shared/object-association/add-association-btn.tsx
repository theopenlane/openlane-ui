import { ArrowLeftRight, Plus } from 'lucide-react'
import React from 'react'

const AddAssociationBtn = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => (
  <button aria-label="Add Association objects" ref={ref} {...props} type="button" className={`h-8 px-1 border rounded-md`}>
    <div className="flex items-center h-full">
      <ArrowLeftRight size={15} className="mr-1" />
      <div className="border-r h-full"></div>
      <Plus size={15} className="ml-1" />
    </div>
  </button>
))

AddAssociationBtn.displayName = 'AddAssociationBtn'
export default AddAssociationBtn
