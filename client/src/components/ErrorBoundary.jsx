import React, { Component } from 'react';
class ErrorBoundary extends Component {
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
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({ 
      error: error || { message: 'Unknown error' },
      errorInfo: errorInfo || { componentStack: 'No stack trace available' }
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{this.state.error?.message || 'There was an error loading this section.'}</p>
            <div className="error-actions">
              <button
                className="retry-btn"
                onClick={this.handleRetry}
              >
                Retry
              </button>
              <button
                className="details-btn"
                onClick={() => {
                  console.error('Error details:', this.state.error);
                  console.error('Error info:', this.state.errorInfo);
                  alert('Error details logged to console');
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;