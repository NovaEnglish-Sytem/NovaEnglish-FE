import React from 'react'
import PropTypes from 'prop-types'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info)
    }
  }

  handleRetry() {
    // Reset error state to re-render children without reloading the page
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      if (fallback) {
        // If fallback is a component (function), render it with error prop
        if (typeof fallback === 'function') {
          const FallbackComp = fallback
          return <FallbackComp error={this.state.error} onRetry={() => this.handleRetry()} />
        }
        // If fallback is a ReactNode, render as is
        return fallback
      }
      // Default minimal fallback
      return (
        <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded">
          Something went wrong. Please try again.
        </div>
      )
    }
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
}

export default ErrorBoundary
