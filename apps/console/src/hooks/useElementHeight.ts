import { type RefObject } from 'react'
import { useElementSize } from '@/hooks/useElementSize'

export const useElementHeight = <T extends HTMLElement>(ref: RefObject<T | null>): number => useElementSize(ref).height
