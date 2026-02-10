import { useMemo, useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { MapControl } from '@/types'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface useMapControlsParams {
  controlData?: (
    | {
        __typename?: typeof ObjectTypes.CONTROL
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }
    | null
    | undefined
  )[]
  subcontrolData?: {
    __typename?: typeof ObjectTypes.SUBCONTROL
    id: string
    refCode: string
    category?: string | null
    subcategory?: string | null
    referenceFramework?: string | null
  }[]
  droppedControls: MapControl[]
  title: 'From' | 'To'
}

export function useMapControls({ controlData, subcontrolData, droppedControls, title }: useMapControlsParams) {
  const form = useFormContext()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; control: MapControl } | null>(null)

  const availableControls: MapControl[] = useMemo(() => {
    const oppositeControlIDs: string[] = form.getValues(title === 'From' ? 'toControlIDs' : 'fromControlIDs') || []
    const oppositeSubcontrolIDs: string[] = form.getValues(title === 'From' ? 'toSubcontrolIDs' : 'fromSubcontrolIDs') || []

    const droppedIds = droppedControls.map((dc) => dc.id)
    const excludeIds = new Set([...droppedIds, ...oppositeControlIDs, ...oppositeSubcontrolIDs])

    const controlNodes = (controlData?.filter(Boolean) as MapControl[]) || []
    const subcontrolNodes = (subcontrolData?.filter(Boolean) as MapControl[]) || []

    return [...controlNodes, ...subcontrolNodes].filter((node) => !excludeIds.has(node.id))
  }, [form, controlData, subcontrolData, droppedControls, title])

  const handleContextMenu = (e: React.MouseEvent, control: MapControl) => {
    e.preventDefault()
    setSelectedIds((prev) => (prev.includes(control.id) ? prev : [control.id]))
    setContextMenu({ x: e.clientX, y: e.clientY, control })
  }

  const handleAddToMapping = (setDroppedControls: React.Dispatch<React.SetStateAction<MapControl[]>>) => {
    const isFrom = title === 'From'
    const controlField = isFrom ? 'fromControlIDs' : 'toControlIDs'
    const subcontrolField = isFrom ? 'fromSubcontrolIDs' : 'toSubcontrolIDs'

    const currentControlIds = form.getValues(controlField) || []
    const currentSubcontrolIds = form.getValues(subcontrolField) || []

    const selectedControls = availableControls.filter((c) => selectedIds.includes(c.id))

    setDroppedControls((prev) => [...prev, ...selectedControls.map((c) => c)])

    const newControlIds = [...currentControlIds]
    const newSubcontrolIds = [...currentSubcontrolIds]

    selectedControls.forEach((c) => {
      if (c.__typename === ObjectTypes.CONTROL && !newControlIds.includes(c.id)) {
        newControlIds.push(c.id)
      } else if (c.__typename === ObjectTypes.SUBCONTROL && !newSubcontrolIds.includes(c.id)) {
        newSubcontrolIds.push(c.id)
      }
    })

    form.setValue(controlField, newControlIds)
    form.setValue(subcontrolField, newSubcontrolIds)
    setContextMenu(null)
  }

  function createDragPreview(label: string) {
    const dragPreview = document.createElement('div')
    dragPreview.innerText = label
    dragPreview.style.padding = '4px 8px'
    dragPreview.style.background = '#1f2937'
    dragPreview.style.color = 'white'
    dragPreview.style.borderRadius = '4px'
    dragPreview.style.fontSize = '12px'
    dragPreview.style.width = '80px'
    dragPreview.style.textAlign = 'center'
    dragPreview.style.position = 'absolute'
    dragPreview.style.top = '-9999px'
    dragPreview.style.left = '-9999px'

    document.body.appendChild(dragPreview)

    setTimeout(() => {
      document.body.removeChild(dragPreview)
    }, 0)

    return dragPreview
  }

  useEffect(() => {
    const droppedIds = new Set(droppedControls.map((c) => c.id))
    setSelectedIds((prev) => prev.filter((id) => !droppedIds.has(id)))
  }, [droppedControls])

  return {
    availableControls,
    selectedIds,
    setSelectedIds,
    contextMenu,
    setContextMenu,
    handleContextMenu,
    handleAddToMapping,
    createDragPreview,
  }
}
