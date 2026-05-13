'use client'

import React from 'react'

import type { DropdownMenuItemProps, DropdownMenuProps } from '@radix-ui/react-dropdown-menu'

import { useComposedRef } from 'platejs/react'
import debounce from 'lodash/debounce.js'
import { EraserIcon, PlusIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorRef, useEditorSelector } from 'platejs/react'

import { buttonVariants } from '@repo/ui/components/ui/button.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/components/ui/dropdown-menu.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { cn } from '@repo/ui/lib/utils'

import { ToolbarButton, ToolbarMenuGroup } from '../ui/toolbar'

export function FontColorToolbarButton({
  children,
  nodeType,
  tooltip,
}: {
  nodeType: string
  tooltip?: string
} & DropdownMenuProps) {
  const editor = useEditorRef()

  const selectionDefined = useEditorSelector((editor) => !!editor.selection, [])

  const color = useEditorSelector((editor) => editor.api.mark(nodeType) as string, [nodeType])

  const [selectedColor, setSelectedColor] = React.useState<string>()
  const [open, setOpen] = React.useState(false)

  const onToggle = React.useCallback(
    (value = !open) => {
      setOpen(value)
    },
    [open, setOpen],
  )

  const updateColor = React.useCallback(
    (value: string) => {
      if (editor.selection) {
        setSelectedColor(value)

        editor.tf.select(editor.selection)
        editor.tf.focus()

        editor.tf.addMarks({ [nodeType]: value })
      }
    },
    [editor, nodeType],
  )

  const updateColorAndClose = React.useCallback(
    (value: string) => {
      updateColor(value)
      onToggle()
    },
    [onToggle, updateColor],
  )

  const clearColor = React.useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection)
      editor.tf.focus()

      if (selectedColor) {
        editor.tf.removeMarks(nodeType)
      }

      onToggle()
    }
  }, [editor, selectedColor, onToggle, nodeType])

  React.useEffect(() => {
    if (selectionDefined) {
      setSelectedColor(color)
    }
  }, [color, selectionDefined])

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
      }}
    >
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltip}>
          {children}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ColorPicker
          color={selectedColor || color}
          clearColor={clearColor}
          colors={getPaletteForNodeType(nodeType)}
          customColors={[]}
          updateColor={updateColorAndClose}
          updateCustomColor={updateColor}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PureColorPicker({
  className,
  clearColor,
  color,
  colors,
  customColors,
  updateColor,
  updateCustomColor,
  ...props
}: React.ComponentProps<'div'> & {
  colors: TColor[]
  customColors: TColor[]
  clearColor: () => void
  updateColor: (color: string) => void
  updateCustomColor: (color: string) => void
  color?: string
}) {
  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <ToolbarMenuGroup label="Custom Colors">
        <ColorCustom color={color} className="px-2" colors={colors} customColors={customColors} updateColor={updateColor} updateCustomColor={updateCustomColor} />
      </ToolbarMenuGroup>
      <ToolbarMenuGroup label="Default Colors">
        <ColorDropdownMenuItems color={color} className="px-2" colors={colors} updateColor={updateColor} />
      </ToolbarMenuGroup>
      {color && (
        <ToolbarMenuGroup>
          <DropdownMenuItem className="p-2" onClick={clearColor}>
            <EraserIcon />
            <span>Clear</span>
          </DropdownMenuItem>
        </ToolbarMenuGroup>
      )}
    </div>
  )
}

const ColorPicker = React.memo(PureColorPicker, (prev, next) => prev.color === next.color && prev.colors === next.colors && prev.customColors === next.customColors)

function ColorCustom({
  className,
  color,
  colors,
  customColors,
  updateColor,
  updateCustomColor,
  ...props
}: {
  colors: TColor[]
  customColors: TColor[]
  updateColor: (color: string) => void
  updateCustomColor: (color: string) => void
  color?: string
} & React.ComponentPropsWithoutRef<'div'>) {
  const [customColor, setCustomColor] = React.useState<string>()
  const [value, setValue] = React.useState<string>(color || '#000000')

  React.useEffect(() => {
    if (!color || customColors.some((c) => c.value === color) || colors.some((c) => c.value === color)) {
      return
    }

    setCustomColor(color)
  }, [color, colors, customColors])

  const computedColors = React.useMemo(
    () =>
      customColor
        ? [
            ...customColors,
            {
              isBrightColor: false,
              name: '',
              value: customColor,
            },
          ]
        : customColors,
    [customColor, customColors],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateCustomColorDebounced = React.useCallback(debounce(updateCustomColor, 100), [updateCustomColor])

  return (
    <div className={cn('relative flex flex-col gap-4', className)} {...props}>
      <ColorDropdownMenuItems color={color} colors={computedColors} updateColor={updateColor}>
        <ColorInput
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            updateCustomColorDebounced(e.target.value)
          }}
        >
          <DropdownMenuItem
            className={cn(
              buttonVariants({
                size: 'icon',
                variant: 'outline',
              }),
              'absolute top-1 right-2 bottom-2 flex size-8 items-center justify-center rounded-full',
            )}
            onSelect={(e) => {
              e.preventDefault()
            }}
          >
            <span className="sr-only">Custom</span>
            <PlusIcon />
          </DropdownMenuItem>
        </ColorInput>
      </ColorDropdownMenuItems>
    </div>
  )
}

function ColorInput({ children, className, value = '#000000', ...props }: React.ComponentProps<'input'>) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-col items-center">
      {React.Children.map(children, (child) => {
        if (!child) return child

        return React.cloneElement(
          child as React.ReactElement<{
            onClick: () => void
          }>,
          {
            onClick: () => inputRef.current?.click(),
          },
        )
      })}
      <input {...props} ref={useComposedRef(props.ref, inputRef)} className={cn('size-0 overflow-hidden border-0 p-0', className)} value={value} type="color" />
    </div>
  )
}

type TColor = {
  isBrightColor: boolean
  name: string
  value: string
}

function ColorDropdownMenuItem({
  className,
  isBrightColor,
  isSelected,
  name,
  updateColor,
  value,
  ...props
}: {
  isBrightColor: boolean
  isSelected: boolean
  value: string
  updateColor: (color: string) => void
  name?: string
} & DropdownMenuItemProps) {
  const content = (
    <DropdownMenuItem
      className={cn(
        buttonVariants({
          size: 'icon',
          variant: 'outline',
        }),
        'my-1 flex size-6 items-center justify-center rounded-full border border-solid border-muted p-0 transition-all hover:scale-125',
        'bg-[unset]',
        !isBrightColor && 'border-transparent',
        isSelected && 'border-2 border-primary',
        className,
      )}
      style={{ backgroundColor: value }}
      onSelect={(e) => {
        e.preventDefault()
        updateColor(value)
      }}
      {...props}
    />
  )

  return name ? (
    <Tooltip>
      <TooltipTrigger>{content}</TooltipTrigger>
      <TooltipContent className="mb-1 capitalize">{name}</TooltipContent>
    </Tooltip>
  ) : (
    content
  )
}

export function ColorDropdownMenuItems({
  className,
  color,
  colors,
  updateColor,
  ...props
}: {
  colors: TColor[]
  updateColor: (color: string) => void
  color?: string
} & React.ComponentProps<'div'>) {
  return (
    <div className={cn('grid grid-cols-[repeat(10,1fr)] place-items-center gap-x-1', className)} {...props}>
      <TooltipProvider>
        {colors.map(({ isBrightColor, name, value }) => (
          <ColorDropdownMenuItem name={name} key={name ?? value} value={value} isBrightColor={isBrightColor} isSelected={color === value} updateColor={updateColor} />
        ))}
        {props.children}
      </TooltipProvider>
    </div>
  )
}

export const DEFAULT_TEXT_COLORS: TColor[] = [
  { isBrightColor: false, name: 'muted', value: 'var(--editor-text-muted, #475569)' },
  { isBrightColor: false, name: 'red', value: 'var(--editor-text-red, #b91c1c)' },
  { isBrightColor: false, name: 'orange', value: 'var(--editor-text-orange, #c2410c)' },
  { isBrightColor: false, name: 'amber', value: 'var(--editor-text-amber, #a16207)' },
  { isBrightColor: false, name: 'green', value: 'var(--editor-text-green, #15803d)' },
  { isBrightColor: false, name: 'teal', value: 'var(--editor-text-teal, #0f766e)' },
  { isBrightColor: false, name: 'blue', value: 'var(--editor-text-blue, #1d4ed8)' },
  { isBrightColor: false, name: 'purple', value: 'var(--editor-text-purple, #6d28d9)' },
  { isBrightColor: false, name: 'pink', value: 'var(--editor-text-pink, #be185d)' },
]

export const DEFAULT_BG_COLORS: TColor[] = [
  { isBrightColor: true, name: 'muted', value: 'var(--editor-bg-muted, #e2e8f0)' },
  { isBrightColor: true, name: 'red', value: 'var(--editor-bg-red, #fecaca)' },
  { isBrightColor: true, name: 'orange', value: 'var(--editor-bg-orange, #fed7aa)' },
  { isBrightColor: true, name: 'amber', value: 'var(--editor-bg-amber, #fde68a)' },
  { isBrightColor: true, name: 'green', value: 'var(--editor-bg-green, #bbf7d0)' },
  { isBrightColor: true, name: 'teal', value: 'var(--editor-bg-teal, #99f6e4)' },
  { isBrightColor: true, name: 'blue', value: 'var(--editor-bg-blue, #bfdbfe)' },
  { isBrightColor: true, name: 'purple', value: 'var(--editor-bg-purple, #ddd6fe)' },
  { isBrightColor: true, name: 'pink', value: 'var(--editor-bg-pink, #fce7f3)' },
]

const getPaletteForNodeType = (nodeType: string): TColor[] => (nodeType === KEYS.backgroundColor ? DEFAULT_BG_COLORS : DEFAULT_TEXT_COLORS)
