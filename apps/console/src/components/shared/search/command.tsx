
'use client'

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/command"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function CommandMenu() {
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
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Go To">
                    <CommandItem
                        onSelect={() => {
                            setOpen(false)
                            router.push('/programs')
                        }} >
                        Programs
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            setOpen(false)
                            router.push('/tasks')
                        }} >
                        My Tasks
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            setOpen(false)
                            router.push('/reporting')
                        }} >
                        Reporting
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog >
    )
}