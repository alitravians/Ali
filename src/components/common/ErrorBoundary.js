import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
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
    const { t } = this.props;
    
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>{t('common.somethingWentWrong')}</h2>
          <p>{t('common.pleaseRefresh')}</p>
          <details>
            <summary>{t('common.errorDetails')}</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
