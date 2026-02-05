'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="p-4 rounded-2xl bg-red-50 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6 text-center max-w-md">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
          </p>
          <Button
            variant="primary"
            onClick={this.handleRetry}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
