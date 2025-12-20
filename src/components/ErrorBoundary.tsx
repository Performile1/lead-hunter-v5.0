import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Application Error Caught:', error);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service if needed
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black uppercase">
                  Något gick fel
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Applikationen stötte på ett oväntat fel
                </p>
              </div>
            </div>

            {/* Error Details */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <p className="font-bold text-red-900 mb-2">Felmeddelande:</p>
              <p className="text-sm text-red-700 font-mono">
                {this.state.error?.message || 'Okänt fel'}
              </p>
            </div>

            {/* Technical Details (Collapsible) */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-black">
                  Tekniska detaljer (utvecklarläge)
                </summary>
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-64">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}

            {/* Possible Causes */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <p className="font-bold text-yellow-900 mb-2">Möjliga orsaker:</p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>API-nycklar saknas eller är ogiltiga</li>
                <li>Nätverksanslutning avbruten</li>
                <li>AI-tjänst (Gemini/Groq) har nått sin kvot</li>
                <li>Ogiltig data från extern källa</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded font-bold uppercase tracking-wide transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Försök igen
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FFC400] hover:bg-yellow-500 text-black px-6 py-3 rounded font-bold uppercase tracking-wide transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Ladda om sidan
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black border-2 border-black px-6 py-3 rounded font-bold uppercase tracking-wide transition-colors"
              >
                <Home className="w-5 h-5" />
                Hem
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Om problemet kvarstår, kontakta support med felmeddelandet ovan.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
