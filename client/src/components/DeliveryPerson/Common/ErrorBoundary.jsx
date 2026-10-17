import React from 'react';

class DeliveryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Delivery Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to analytics service if available
    if (window.analytics) {
      window.analytics.track('delivery_component_error', {
        error: error.message,
        component: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="delivery-error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <i data-lucide="alert-triangle"></i>
            </div>
            <h3>Something went wrong</h3>
            <p>We're having trouble loading this section.</p>
            
            {this.state.error && (
              <div className="error-details">
                <p><strong>Error:</strong> {this.state.error.toString()}</p>
              </div>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="retry-btn"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="reload-btn"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DeliveryErrorBoundary;