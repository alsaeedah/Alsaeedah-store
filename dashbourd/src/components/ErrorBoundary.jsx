import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }}>
          <h1 style={{ color: '#d32f2f' }}>حدث خطأ غير متوقع</h1>
          <p>نعتذر، واجه التطبيق مشكلة أثناء التشغيل.</p>
          <div style={{
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '15px', 
            borderRadius: '5px', 
            marginTop: '20px', 
            textAlign: 'left',
            direction: 'ltr',
            display: 'inline-block',
            maxWidth: '80%',
            overflowX: 'auto'
          }}>
            <strong>تفاصيل الخطأ:</strong><br />
            <code>{this.state.error && this.state.error.toString()}</code>
          </div>
          <br />
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '30px', 
              padding: '10px 20px', 
              fontSize: '16px', 
              cursor: 'pointer',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
