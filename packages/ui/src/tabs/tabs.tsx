'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'
import { tabsStyles, type TabsVariants } from './tabs.styles'

const { tabsList, tabsTrigger, tabsContent } = tabsStyles()
const Tabs = ({
  variant,
  ...props
}: TabsVariants &
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) => (
  <TabsProvider variant={variant as 'underline' | 'solid'}>
    <TabsPrimitive.Root {...props} />
  </TabsProvider>
)

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}
interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}
interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

interface TabsContextValue {
  variant: TabsVariants['variant']
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
  children: React.ReactNode
}

const TabsProvider: React.FC<TabsProviderProps> = ({ variant, children }) => {
  return (
    <TabsContext.Provider value={{ variant }}>{children}</TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, ...props }, ref) => {
  const { variant } = useTabsContext()
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsList({ variant }), className)}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, ...props }, ref) => {
  const { variant } = useTabsContext()
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTrigger({ variant }), className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => {
  const { variant } = useTabsContext()
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(tabsContent({ variant }), className)}
      {...props}
    />
  )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
