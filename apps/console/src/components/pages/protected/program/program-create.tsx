'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/dialog"
import { ProgramWizard } from "./wizard"
import { ArrowUpRightIcon } from "lucide-react"

const ProgramCreate = () => {
    return (
        <>
            <Dialog >
                <DialogTrigger className="flex h-12 rounded-md text-base px-5 bg-java-400 dark:bg-java-400 hover:!opacity-90 text-oxford-blue-100 dark:text-oxford-blue-900 relative group font-sans font-semibold text-oxford-blue-900 inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md leading-none transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oxford-blue-300 disabled:pointer-events-none disabled:opacity-50">
                    Create Program <ArrowUpRightIcon className="h-4 w-4" />
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Create a New Program</DialogTitle>
                        <DialogDescription>
                            Create a new program to manage your compliance activities.
                        </DialogDescription>
                    </DialogHeader>
                    <ProgramWizard />
                </DialogContent>
            </Dialog >
        </>
    )
}

export { ProgramCreate }
