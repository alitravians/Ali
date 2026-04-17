import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — catches render errors in child components
 * and shows a friendly Arabic error message instead of a white screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary] Component error:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">حدث خطأ غير متوقع</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-md">
            نعتذر عن هذا الخلل. يمكنك تحديث الصفحة للمتابعة.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/30 transition-colors"
          >
            تحديث الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
