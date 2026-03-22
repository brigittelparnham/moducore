import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional fallback — defaults to a full-page error card. */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Top-level error boundary.
 *
 * Catches unhandled render/lifecycle errors anywhere in the tree and shows
 * a friendly recovery UI instead of a blank screen.  Logs the error info to
 * the console (swap for your error-reporting service here).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    // TODO: forward to Sentry / Datadog / etc.
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              An unexpected error occurred. Try refreshing the page — if the
              problem persists, contact support.
            </p>
            <p className="text-xs font-mono text-red-500 bg-red-50 rounded p-3 text-left break-all mb-6">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
