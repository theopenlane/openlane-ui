'use client'

import React from 'react'
import PermissionGate from '@/components/shared/protected-area/permission-gate'
import { AccessEnum } from '@/lib/authz/enums/access-enum'

const Layout = ({ children }: { children: React.ReactNode }) => <PermissionGate permission={AccessEnum.CanCreateEmailTemplate}>{children}</PermissionGate>

export default Layout
