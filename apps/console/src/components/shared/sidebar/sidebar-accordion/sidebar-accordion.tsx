'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { cn } from '@repo/ui/lib/utils'
import { sidebarAccordionStyles } from './sidebar-accordion.styles'
import { forwardRef, ElementRef, ComponentPropsWithoutRef } from 'react'

const Accordion = AccordionPrimitive.Root

const {
  accordionItem,
  accordionHeader,
  accordionContent,
  accordionContentInner,
  accordionTriggerHeader,
} = sidebarAccordionStyles()

const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItem(), className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className={accordionTriggerHeader()}>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(accordionHeader(), className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={accordionContent()}
    {...props}
  >
    <div className={cn(accordionContentInner(), className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
