import React from 'react';
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-somnia-bg text-foreground flex items-center justify-center p-6">
          <div className="text-center border border-somnia-border rounded bg-somnia-card p-8 max-w-md">
            <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred while loading the page.'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-somnia-border hover:bg-somnia-hover"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}