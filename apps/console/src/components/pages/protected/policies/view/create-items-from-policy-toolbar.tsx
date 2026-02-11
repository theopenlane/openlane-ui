import React from 'react'
import { CirclePlus } from 'lucide-react'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

type TCreateItemsFromPolityProps = {
  handleCreateNewPolicy: () => void
  handleCreateNewProcedure: () => void
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}

const CreateItemsFromPolicyToolbar: React.FC<TCreateItemsFromPolityProps> = ({ handleCreateNewPolicy, handleCreateNewProcedure, initialData, objectAssociationsDisplayIDs }) => {
  const { data: permission } = useOrganizationRoles()
  return (
    <div className="grow flex flex-row items-center gap-2 justify-end">
      <Menu
        trigger={CreateBtn}
        content={
          <>
            {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
              <button className="flex items-center space-x-2 px-1 cursor-pointer bg-transparent" onClick={handleCreateNewPolicy}>
                <CirclePlus size={16} strokeWidth={2} />
                <span>Policy</span>
              </button>
            )}
            {canCreate(permission?.roles, AccessEnum.CanCreateProcedure) && (
              <button className="flex items-center space-x-2 px-1 cursor-pointer bg-transparent" onClick={handleCreateNewProcedure}>
                <CirclePlus size={16} strokeWidth={2} />
                <span>Procedure</span>
              </button>
            )}
            <CreateTaskDialog
              className="bg-transparent"
              initialData={initialData}
              trigger={
                <button className="flex items-center space-x-2 px-1 cursor-pointer bg-transparent">
                  <CirclePlus size={16} strokeWidth={2} />
                  <span>Task</span>
                </button>
              }
              objectAssociationsDisplayIDs={objectAssociationsDisplayIDs}
            />
          </>
        }
      />
    </div>
  )
}

export default CreateItemsFromPolicyToolbar
