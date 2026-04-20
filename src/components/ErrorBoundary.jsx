import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI layout
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Graceful catch avoiding native React application crash
    console.error('ErrorBoundary caught an error resolving component tree:', error, errorInfo);
  }

  handleRetry = () => {
    // Permits forcing remounts if component crashed transiently
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 bg-transparent animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-sm text-center">
            
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Something broke!</h2>
            
            <p className="text-gray-500 mb-6 text-sm font-medium">
              {this.state.error?.message || "An unexpected rendering protocol crashed this component."}
            </p>
            
            <button 
              onClick={this.handleRetry} 
              className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition shadow-md w-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Attempt Retry
            </button>
            
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
