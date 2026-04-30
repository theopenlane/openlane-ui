'use client'

import React, { useMemo } from 'react'
import { computeDiff, type DiffOperation, type DiffUpdate, withGetFragmentExcludeDiff } from '@platejs/diff'
import cloneDeep from 'lodash/cloneDeep'
import { createSlatePlugin, type Descendant, type Value } from 'platejs'
import { createPlateEditor, Plate, PlateContent, PlateLeaf, type PlateLeafProps, toPlatePlugin, usePlateEditor } from 'platejs/react'
import { BaseEditorKit } from '@repo/ui/components/editor/editor-base-kit.tsx'

type VersionDiffProps = {
  previous: Descendant[] | null | undefined
  current: Descendant[] | null | undefined
}

const diffOperationColors: Record<DiffOperation['type'], string> = {
  delete: 'bg-red-200 text-red-950 dark:bg-red-500/30 dark:text-red-50',
  insert: 'bg-green-200 text-green-950 dark:bg-green-500/30 dark:text-green-50',
  update: 'bg-blue-200 text-blue-950 dark:bg-blue-500/30 dark:text-blue-50',
}

const describeUpdate = ({ newProperties, properties }: DiffUpdate): string => {
  const added: string[] = []
  const removed: string[] = []
  const updated: string[] = []
  for (const key of Object.keys(newProperties)) {
    const oldVal = properties[key]
    const newVal = newProperties[key]
    if (oldVal === undefined) added.push(key)
    else if (newVal === undefined) removed.push(key)
    else updated.push(key)
  }
  const parts: string[] = []
  if (added.length > 0) parts.push(`Added ${added.join(', ')}`)
  if (removed.length > 0) parts.push(`Removed ${removed.join(', ')}`)
  for (const key of updated) parts.push(`Updated ${key} from ${properties[key]} to ${newProperties[key]}`)
  return parts.join('\n')
}

const DiffLeaf = ({ children, ...props }: PlateLeafProps) => {
  const op = props.leaf.diffOperation as DiffOperation | undefined
  return (
    <PlateLeaf
      {...props}
      className={op ? diffOperationColors[op.type] : undefined}
      attributes={{
        ...props.attributes,
        title: op?.type === 'update' ? describeUpdate(op) : undefined,
      }}
    >
      {children}
    </PlateLeaf>
  )
}

const DiffPlugin = toPlatePlugin(createSlatePlugin({ key: 'diff', node: { isLeaf: true } }).overrideEditor(withGetFragmentExcludeDiff), {
  render: {
    node: DiffLeaf,
    aboveNodes:
      () =>
      ({ children, editor, element }) => {
        if (!element.diff) return children
        const op = element.diffOperation as DiffOperation
        const Component = editor.api.isInline(element) ? 'span' : 'div'
        const label = op.type === 'delete' ? 'deletion' : op.type === 'insert' ? 'insertion' : 'update'
        return (
          <Component className={diffOperationColors[op.type]} title={op.type === 'update' ? describeUpdate(op) : undefined} aria-label={label}>
            {children}
          </Component>
        )
      },
  },
})

const diffPlugins = [...BaseEditorKit, DiffPlugin]

const VersionDiff: React.FC<VersionDiffProps> = ({ previous, current }) => {
  const diffValue = useMemo<Value | null>(() => {
    if (!Array.isArray(previous) || !Array.isArray(current)) return null
    try {
      const editor = createPlateEditor({ plugins: diffPlugins })
      return computeDiff(cloneDeep(previous) as Descendant[], cloneDeep(current) as Descendant[], {
        isInline: editor.api.isInline,
        lineBreakChar: '¶',
      }) as Value
    } catch (e) {
      console.warn('[VersionDiff] computeDiff failed', e)
      return null
    }
  }, [previous, current])

  const editor = usePlateEditor(
    {
      plugins: diffPlugins,
      value: diffValue ?? [],
    },
    [diffValue],
  )

  if (!diffValue) {
    return <div className="text-sm text-muted-foreground p-4">Diff view unavailable for this version.</div>
  }

  if (diffValue.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No detail changes.</div>
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-200 dark:bg-green-500/30" /> added
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-200 dark:bg-red-500/30" /> removed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-200 dark:bg-blue-500/30" /> updated
        </span>
      </div>
      <Plate readOnly editor={editor}>
        <PlateContent className="rounded-md border p-3 prose prose-sm max-w-none dark:prose-invert" />
      </Plate>
    </div>
  )
}

export default VersionDiff
