import { useRouter } from "next/navigation"
import { pageStyles } from "./page.styles"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/dropdown-menu"
import { Button } from "@repo/ui/button"
import { FilePlus, PlusIcon } from "lucide-react"
import { TemplateList } from "./templates"

const ICON_SIZE = 14

export const CreateDropdown = () => {
    const router = useRouter()
  
    const handleCreateNew = () => {
      router.push('/documents/questionnaire-editor')
    }
  
    const {
      buttons,
    } = pageStyles()
  

    return (
        <div className={buttons()} >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button            
                icon={<PlusIcon />}
                iconPosition="left"
                onClick={handleCreateNew}
                >
                Create New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleCreateNew} >
              < FilePlus width={ICON_SIZE} />From Scratch
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => {
              e.preventDefault();
            }} >
              < TemplateList />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </div>
    )
  }
  