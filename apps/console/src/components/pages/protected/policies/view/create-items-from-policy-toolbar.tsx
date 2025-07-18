import React from 'react'
import { CirclePlus } from 'lucide-react'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { TaskIconBtn } from '@/components/shared/enum-mapper/task-enum'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'

type TCreateItemsFromPolityProps = {
  handleCreateNewPolicy: () => void
  handleCreateNewProcedure: () => void
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}

const CreateItemsFromPolicyToolbar: React.FC<TCreateItemsFromPolityProps> = ({ handleCreateNewPolicy, handleCreateNewProcedure, initialData, objectAssociationsDisplayIDs }) => {
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)
  return (
    <div className="grow flex flex-row items-center gap-2 justify-end">
      <Menu
        trigger={CreateBtn}
        content={
          <>
            {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
              <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleCreateNewPolicy}>
                <CirclePlus size={16} strokeWidth={2} />
                <span>Policy</span>
              </div>
            )}
            {canCreate(permission?.roles, AccessEnum.CanCreateProcedure) && (
              <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleCreateNewProcedure}>
                <CirclePlus size={16} strokeWidth={2} />
                <span>Procedure</span>
              </div>
            )}
            <CreateTaskDialog initialData={initialData} trigger={TaskIconBtn} objectAssociationsDisplayIDs={objectAssociationsDisplayIDs} />
          </>
        }
      />
    </div>
  )
}

export default CreateItemsFromPolicyToolbar
