'use client'

import React from 'react'

type FallbackRender = (error: Error, reset: () => void) => React.ReactNode

type Props = {
  fallback: React.ReactNode | FallbackRender
  onError?: (error: Error, info: React.ErrorInfo) => void
  resetKey?: unknown
  children: React.ReactNode
}

type State = { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return typeof this.props.fallback === 'function' ? (this.props.fallback as FallbackRender)(error, this.reset) : this.props.fallback
  }
}
