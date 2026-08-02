import React from 'react';
import { RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in React tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#0a0a0a',
          color: '#f8f8f8',
          fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ff4d4f' }}>
            عذراً، حدث خطأ غير متوقع
          </h1>
          <p style={{ marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.6', color: '#a0a0a0' }}>
            نعتذر عن هذا الخلل. لقد واجه التطبيق مشكلة أثناء التحميل. يرجى محاولة تحديث الصفحة أو العودة للرئيسية.
          </p>
          
          {/* Show technical details only in development */}
          {import.meta.env.DEV && this.state.error && (
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '2rem',
              maxWidth: '600px',
              overflowX: 'auto',
              textAlign: 'left'
            }}>
              <code style={{ color: '#ff4d4f', fontSize: '0.9rem' }}>
                {this.state.error.toString()}
              </code>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              <RefreshCw size={20} />
              تحديث الصفحة
            </button>
            
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid #333',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Home size={20} />
              الرئيسية
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
