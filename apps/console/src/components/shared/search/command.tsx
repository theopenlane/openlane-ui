
'use client'

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/command"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { NavHeading, type NavItem, type Separator } from '@/types'


interface CommandNavProps {
    items: (NavItem | Separator | NavHeading)[]
}

export function CommandMenu({ items }: CommandNavProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Type a command or search..." />
            <CommandList className="max-h-[calc(100vh-24rem)]">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Go To">
                    {items.filter(item => 'href' in item).map((item, idx) => (
                        <div key={idx}>
                            {'children' in item && item.children && item.children.map((child, childIdx) => (
                                <CommandItem
                                    key={`${idx}-${childIdx}`}
                                    onSelect={() => {
                                        setOpen(false)
                                        router.push(child.href)
                                    }} >
                                    {child.title}
                                </CommandItem>
                            ))}
                            <CommandItem
                                key={idx}
                                onSelect={() => {
                                    setOpen(false)
                                    router.push(item.href)
                                }} >
                                {item.title}
                            </CommandItem>
                        </div>
                    ))}

                </CommandGroup>
            </CommandList>
        </CommandDialog >
    )
}