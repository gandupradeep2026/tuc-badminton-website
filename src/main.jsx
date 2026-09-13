import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <h2 style={{ color: '#005A36' }}>TU Chemnitz Badminton Portal</h2>
          <p>Ein Fehler ist beim Laden der Seite aufgetreten:</p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflowX: 'auto', textAlign: 'left', color: '#b91c1c' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#005A36', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
