'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { PlusSquare, Upload, CheckCircle2, MoreHorizontal, Target, GitBranch } from 'lucide-react'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import Link from 'next/link'
import EvidenceCreateSheet from '@/components/pages/protected/evidence/evidence-create-sheet'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/control-implementation/create-control-implementation-sheet.tsx'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'

interface QuickActionsProps {
  controlId: string
  evidenceFormData: {
    displayID?: string
    controlID: string
    controlRefCodes: string[]
    referenceFramework: Record<string, string>
    programDisplayIDs: string[]
    objectAssociations: {
      controlIDs: string[]
      programIDs: string[]
      controlObjectiveIDs: string[]
    }
    objectAssociationsDisplayIDs: string[]
  }
  evidenceControlParam: {
    id: string
    referenceFramework: Record<string, string>
    controlRefCodes: string[]
  }
  taskInitialData: {
    programIDs: string[]
    procedureIDs: string[]
    internalPolicyIDs: string[]
    controlObjectiveIDs: string[]
    riskIDs: string[]
    controlIDs: string[]
  }
}

interface ActionItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
}

const QuickActions: React.FC<QuickActionsProps> = ({ controlId, evidenceFormData, evidenceControlParam, taskInitialData }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState<number | null>(null)
  const [isEvidenceSheetOpen, setIsEvidenceSheetOpen] = useState(false)
  const [showCreateImplementationSheet, setShowCreateImplementationSheet] = useState(false)
  const [showCreateObjectiveSheet, setShowCreateObjectiveSheet] = useState(false)
  const lastWidthRef = useRef<number>(0)

  const actions: ActionItem[] = [
    {
      id: 'add-implementation',
      label: 'Add Implementation',
      icon: <PlusSquare size={16} />,
      onClick: () => setShowCreateImplementationSheet(true),
    },
    {
      id: 'add-objective',
      label: 'Add Objective',
      icon: <Target size={16} />,
      onClick: () => setShowCreateObjectiveSheet(true),
    },
    {
      id: 'upload-evidence',
      label: 'Upload Evidence',
      icon: <Upload size={16} />,
      onClick: () => setIsEvidenceSheetOpen(true),
    },
    {
      id: 'create-task',
      label: 'Create Task',
      icon: <CheckCircle2 size={16} />,
    },
    {
      id: 'create-subcontrol',
      label: 'Create Subcontrol',
      icon: <PlusSquare size={16} />,
      href: `/controls/${controlId}/create-subcontrol`,
    },
    {
      id: 'map-control',
      label: 'Map Control',
      icon: <GitBranch size={16} />,
      href: `/controls/${controlId}/map-control`,
    },
  ]

  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!containerRef.current || !measureRef.current) return

      const containerWidth = containerRef.current.offsetWidth

      if (Math.abs(containerWidth - lastWidthRef.current) < 5) return
      lastWidthRef.current = containerWidth

      const measureChildren = Array.from(measureRef.current.children) as HTMLElement[]
      if (measureChildren.length === 0) return

      const moreButtonWidth = 40
      const gap = 8
      let totalWidth = 0
      let count = 0

      for (const child of measureChildren) {
        const childWidth = child.offsetWidth + gap
        if (totalWidth + childWidth + moreButtonWidth > containerWidth && count > 0) {
          break
        }
        totalWidth += childWidth
        count++
      }

      const allItemsWidth = measureChildren.reduce((sum, child) => sum + child.offsetWidth + gap, 0) - gap
      if (allItemsWidth <= containerWidth) {
        setVisibleCount(null)
      } else {
        setVisibleCount(Math.max(1, count))
      }
    }

    const timer = setTimeout(calculateVisibleItems, 0)

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateVisibleItems)
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
  }, [])

  const showAll = visibleCount === null
  const visibleActions = showAll ? actions : actions.slice(0, visibleCount)
  const overflowActions = showAll ? [] : actions.slice(visibleCount)

  const renderActionButton = (action: ActionItem, inMenu = false) => {
    if (action.id === 'create-task' && !inMenu) {
      return (
        <CreateTaskDialog
          key={action.id}
          trigger={
            <Button type="button" variant="secondary" className="h-8 px-3" icon={action.icon}>
              {action.label}
            </Button>
          }
          defaultSelectedObject={ObjectTypeObjects.CONTROL}
          initialData={taskInitialData}
        />
      )
    }

    if (action.href) {
      if (inMenu) {
        return (
          <Link key={action.id} href={action.href}>
            <button className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer w-full">
              {action.icon}
              <span>{action.label}</span>
            </button>
          </Link>
        )
      }
      return (
        <Link key={action.id} href={action.href}>
          <Button type="button" variant="secondary" className="h-8 px-3" icon={action.icon}>
            {action.label}
          </Button>
        </Link>
      )
    }

    if (inMenu) {
      return (
        <button key={action.id} onClick={action.onClick} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer w-full">
          {action.icon}
          <span>{action.label}</span>
        </button>
      )
    }

    return (
      <Button key={action.id} type="button" variant="secondary" className="h-8 px-3" icon={action.icon} onClick={action.onClick}>
        {action.label}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Quick Actions</p>

      <div ref={measureRef} className="flex gap-2 invisible absolute pointer-events-none" aria-hidden="true">
        {actions.map((action) => (
          <Button key={action.id} type="button" variant="secondary" className="h-8 px-3" icon={action.icon}>
            {action.label}
          </Button>
        ))}
      </div>

      <div ref={containerRef} className="flex flex-wrap gap-2 items-center">
        {visibleActions.map((action) => renderActionButton(action))}

        {overflowActions.length > 0 && (
          <Menu
            trigger={
              <Button type="button" variant="secondary" className="h-8 px-2">
                <MoreHorizontal size={16} />
              </Button>
            }
            content={<>{overflowActions.map((action) => renderActionButton(action, true))}</>}
          />
        )}
      </div>

      <EvidenceCreateSheet
        open={isEvidenceSheetOpen}
        onEvidenceCreateSuccess={() => setIsEvidenceSheetOpen(false)}
        onOpenChange={setIsEvidenceSheetOpen}
        formData={evidenceFormData}
        controlParam={[
          {
            id: evidenceControlParam.id,
            referenceFramework: Object.values(evidenceControlParam.referenceFramework)[0] ?? '',
            refCode: evidenceControlParam.controlRefCodes?.[0] ?? '',
            __typename: 'Control',
          },
        ]}
        excludeObjectTypes={[
          ObjectTypeObjects.EVIDENCE,
          ObjectTypeObjects.RISK,
          ObjectTypeObjects.PROCEDURE,
          ObjectTypeObjects.GROUP,
          ObjectTypeObjects.INTERNAL_POLICY,
          ObjectTypeObjects.CONTROL,
          ObjectTypeObjects.SUB_CONTROL,
          ObjectTypeObjects.PROGRAM,
        ]}
        defaultSelectedObject={ObjectTypeObjects.TASK}
      />
      <CreateControlImplementationSheet open={showCreateImplementationSheet} onOpenChange={setShowCreateImplementationSheet} />
      <CreateControlObjectiveSheet open={showCreateObjectiveSheet} onOpenChange={setShowCreateObjectiveSheet} />
    </div>
  )
}

export default QuickActions
