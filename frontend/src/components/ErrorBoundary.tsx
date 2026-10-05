import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[error-boundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (error !== null) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            حدث خطأ غير متوقع
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            حاول مجدداً
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
