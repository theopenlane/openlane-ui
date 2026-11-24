'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'
import { tabsStyles, type TabsVariants } from './tabs.styles'

const { tabsList, tabsTrigger, tabsContent } = tabsStyles()

type TabsProps = TabsVariants & React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { panelless?: boolean }

const Tabs = ({ variant, panelless = false, ...props }: TabsProps) => (
  <TabsProvider variant={variant as 'underline' | 'solid'} panelless={panelless}>
    <TabsPrimitive.Root {...props} />
  </TabsProvider>
)

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}
interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}
interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

interface TabsContextValue {
  variant: TabsVariants['variant']
  panelless: boolean
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider')
  }
  return context
}

interface TabsProviderProps {
  variant: TabsVariants['variant']
  panelless: boolean
  children: React.ReactNode
}

const TabsProvider: React.FC<TabsProviderProps> = ({ variant, panelless, children }) => {
  const value = React.useMemo(() => ({ variant, panelless }), [variant, panelless])
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

const TabsList = ({ className, ref, ...props }: TabsListProps & { ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.List>> }) => {
  const { variant } = useTabsContext()
  return <TabsPrimitive.List ref={ref} className={cn(tabsList({ variant }), className)} {...props} />
}

const TabsTrigger = ({ className, ref, onMouseDown, ...props }: TabsTriggerProps & { ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>> }) => {
  const { variant, panelless } = useTabsContext()

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    onMouseDown?.(event)
    if (event.defaultPrevented || props.disabled || event.button !== 0 || event.ctrlKey) return
    event.currentTarget.focus({ focusVisible: false })
  }

  return <TabsPrimitive.Trigger ref={ref} className={cn(tabsTrigger({ variant }), className)} onMouseDown={handleMouseDown} {...(panelless ? { 'aria-controls': undefined } : {})} {...props} />
}

const TabsContent = ({ className, ref, ...props }: TabsContentProps & { ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Content>> }) => {
  const { variant } = useTabsContext()
  return <TabsPrimitive.Content ref={ref} className={cn(tabsContent({ variant }), className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
