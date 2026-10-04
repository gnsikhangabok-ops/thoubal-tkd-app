import { Component } from 'react'
import { WifiOff } from 'lucide-react'

// Catches a section that failed to load (usually a dropped connection) and offers a retry
// instead of leaving the screen blank.
export default class ChunkErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Page failed to load:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="paytm min-h-[60vh] grid place-items-center p-6 font-body">
        <div className="bg-surface rounded-3xl shadow-card p-8 max-w-sm text-center">
          <span className="grid place-items-center w-14 h-14 mx-auto rounded-full bg-pay-sky text-pay-action"><WifiOff /></span>
          <h1 className="text-xl font-bold mt-4">This page couldn't load</h1>
          <p className="text-sm text-muted mt-2">Check your internet connection and try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-pay-action px-6 py-2.5 text-sm font-semibold text-white hover:bg-pay-action-dark"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}
