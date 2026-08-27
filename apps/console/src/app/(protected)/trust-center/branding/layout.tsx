'use client'

import React from 'react'
import TrustCenterEditorGate from '@/components/shared/protected-area/trust-center-editor-gate'

const Layout = ({ children }: { children: React.ReactNode }) => <TrustCenterEditorGate>{children}</TrustCenterEditorGate>

export default Layout
