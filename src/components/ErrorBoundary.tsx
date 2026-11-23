import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/** Keeps a render error from leaving a permanently blank/black screen. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Mythos render error:', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#090d16] text-neutral-100 p-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          <h1 className="text-lg font-bold">Mythos hits an error</h1>
          <p className="text-sm text-neutral-400">
            The interface could not be rendered. Your notes on disk are not deleted.
          </p>
          <pre className="text-[11px] text-red-300 bg-neutral-950 rounded-lg p-3 overflow-auto max-h-40">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors"
          >
            Reload Mythos
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
