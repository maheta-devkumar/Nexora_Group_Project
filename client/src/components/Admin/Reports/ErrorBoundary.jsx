import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import './ErrorBoundary.css'; // CSS import added

class ErrorBoundary extends React.Component {
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
    this.setState({ errorInfo });
    console.error('Component Error:', error);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary bg-white rounded-xl shadow-lg p-6 border border-red-100 m-4"> {/* Added class name */}
          <div className="flex items-start mb-4">
            <div className="error-icon bg-red-100 p-3 rounded-lg mr-4"> {/* Added class name */}
              <FaExclamationTriangle className="text-red-600 text-2xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
              <p className="error-message text-gray-600 mb-4"> {/* Added class name */}
                An error occurred while rendering this component. 
                This might be due to invalid data or a network issue.
              </p>
              
              {this.state.error && (
                <div className="error-details bg-red-50 border border-red-200 rounded-lg p-3 mb-4"> {/* Added class name */}
                  <p className="text-red-700 font-medium mb-1">Error details:</p>
                  <p className="text-red-600 text-sm">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              
              <div className="error-actions flex space-x-3"> {/* Added class name */}
                <button
                  onClick={this.handleReset}
                  className="retry-btn flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" // Added class name
                >
                  <FaRedo className="mr-2" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="reload-btn px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" // Added class name
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;