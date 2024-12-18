'use client'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@repo/ui/breadcrumb'
import { SlashIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { ReactNode } from 'react'
import { toTitleCase } from '@/components/shared/lib/strings'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type TBreadCrumbProps = {
    homeElement?: string,
}

export const BreadcrumbNavigation = ({ homeElement }: TBreadCrumbProps) => {
    const paths = usePathname()
    const pathNames = paths.split('/').filter(path => path)

    const separator = <SlashIcon size={14} />

    if (homeElement === undefined) {
        homeElement = 'Home'
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">{homeElement}</BreadcrumbLink>
                </BreadcrumbItem>
                {pathNames.length > 0 && separator}
                {
                    pathNames.map((link, index) => {
                        let href = `/${pathNames.slice(0, index + 1).join('/')}`
                        let itemLink = toTitleCase(link).replaceAll("-", " ")
                        return (
                            <React.Fragment key={index}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={href}>{itemLink}</BreadcrumbLink>
                                </BreadcrumbItem>
                                {pathNames.length !== index + 1 && separator}
                            </React.Fragment>
                        )
                    })
                }
            </BreadcrumbList>
        </Breadcrumb>
    )
}