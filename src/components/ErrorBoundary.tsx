import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected issue occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('OPEN FEELING ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FCFBFA] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-4">
            <h1 className="text-2xl font-display text-[#29272B]">
              Something gentle paused
            </h1>
            <p className="text-sm text-[#6B6770] leading-relaxed">
              We encountered an unexpected error while loading this space. Your thoughts and saved entries remain safe.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#9F4E65] text-[#FCFBFA] text-sm font-medium hover:bg-[#8A4358] transition-colors cursor-pointer"
            >
              Refresh OPEN FEELING
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
