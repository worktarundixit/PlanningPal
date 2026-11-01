import { Component, type ReactNode } from 'react'
import { StatusScreen } from './StatusScreen'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <StatusScreen kind="error" onRetry={() => window.location.reload()} />
    }
    return this.props.children
  }
}
