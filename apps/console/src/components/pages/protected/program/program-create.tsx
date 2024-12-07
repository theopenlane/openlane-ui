'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/dialog"
import { ProgramWizard } from "./wizard"


const ProgramCreate = () => {
    return (
        <>
            <Dialog >
                <DialogTrigger>
                    Create Program
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
