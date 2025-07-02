/**
 * Error handling utilities for user-friendly error messages.
 */

export interface ErrorResponse {
  detail: string;
  status?: number;
  code?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestions?: string[];
  isUserError: boolean;
}

/**
 * Convert API errors to user-friendly messages
 */
export function parseApiError(error: any): UserFriendlyError {
  // Default error
  let result: UserFriendlyError = {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    isUserError: false
  };

  // Handle network errors
  if (!navigator.onLine) {
    return {
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      suggestions: ['Check your network connection', 'Try refreshing the page'],
      isUserError: true
    };
  }

  // Handle different error types
  if (error?.response?.status) {
    const status = error.response.status;
    const detail = error.response.data?.detail || error.message || 'Unknown error';

    switch (status) {
      case 400:
        result = {
          title: 'Invalid Request',
          message: detail,
          suggestions: ['Check your input and try again', 'Make sure all required fields are filled'],
          isUserError: true
        };
        break;

      case 401:
        result = {
          title: 'Authentication Required',
          message: 'Your session has expired. Please refresh the page.',
          suggestions: ['Refresh the page', 'Check your Home Assistant connection'],
          isUserError: true
        };
        break;

      case 403:
        result = {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          suggestions: ['Check your Home Assistant user permissions'],
          isUserError: true
        };
        break;

      case 404:
        result = {
          title: 'Not Found',
          message: 'The requested resource was not found.',
          suggestions: ['The item may have been deleted', 'Try refreshing the page'],
          isUserError: true
        };
        break;

      case 422:
        result = {
          title: 'Validation Error',
          message: detail,
          suggestions: ['Check your input values', 'Make sure all required fields are correct'],
          isUserError: true
        };
        break;

      case 429:
        result = {
          title: 'Too Many Requests',
          message: 'You\'re making requests too quickly. Please wait a moment.',
          suggestions: ['Wait a few seconds and try again'],
          isUserError: true
        };
        break;

      case 500:
        result = {
          title: 'Server Error',
          message: 'The server encountered an error. Please try again later.',
          suggestions: ['Try again in a few minutes', 'Check the server logs if the problem persists'],
          isUserError: false
        };
        break;

      case 502:
      case 503:
      case 504:
        result = {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
          suggestions: ['Wait a few minutes and try again', 'Check your network connection'],
          isUserError: false
        };
        break;

      default:
        result = {
          title: `Error ${status}`,
          message: detail,
          isUserError: status < 500
        };
    }
  } else if (error?.code) {
    // Handle specific error codes and messages
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Check for API key related errors
    if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid_api_key')) {
      result = {
        title: 'API Key Error',
        message: 'Your API key appears to be invalid or missing.',
        suggestions: [
          'Check that your API key is entered correctly',
          'Verify the API key is active and has sufficient credits',
          'Generate a new API key if needed',
          'Ensure you\'re using the correct provider endpoint'
        ],
        isUserError: true
      };
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      result = {
        title: 'Rate Limit Exceeded',
        message: 'You\'ve exceeded your API usage limits.',
        suggestions: [
          'Wait a few minutes before trying again',
          'Check your API plan and usage limits',
          'Consider upgrading your API plan',
          'Try using fewer files in your scan'
        ],
        isUserError: true
      };
    } else if (errorMessage.includes('no valid profiles') || errorMessage.includes('llm profile')) {
      result = {
        title: 'LLM Profile Required',
        message: 'No valid LLM profiles are configured.',
        suggestions: [
          'Go to Settings and add an LLM profile',
          'Ensure your API key is entered correctly',
          'Test your connection before running scans',
          'Use the Quick Setup wizard for guided configuration'
        ],
        isUserError: true
      };
    }
    
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'ECONNREFUSED':
        result = {
          title: 'Connection Failed',
          message: 'Could not connect to the server. Please check your connection.',
          suggestions: ['Check your network connection', 'Verify the server is running', 'Try refreshing the page'],
          isUserError: false
        };
        break;

      case 'TIMEOUT':
        result = {
          title: 'Request Timeout',
          message: 'The request took too long to complete.',
          suggestions: [
            'Try again with fewer files',
            'Check your network connection', 
            'The LLM provider might be experiencing delays'
          ],
          isUserError: false
        };
        break;

      default:
        result.message = error.message || result.message;
    }
  } else if (error?.message) {
    // Handle JavaScript errors
    if (error.message.includes('fetch')) {
      result = {
        title: 'Network Error',
        message: 'Failed to connect to the server.',
        suggestions: ['Check your network connection', 'Try refreshing the page'],
        isUserError: false
      };
    } else {
      result.message = error.message;
    }
  }

  return result;
}

/**
 * Get user-friendly error message for specific operations
 */
export function getOperationError(operation: string, error: any): UserFriendlyError {
  const baseError = parseApiError(error);
  
  const operationMessages: Record<string, Partial<UserFriendlyError>> = {
    scan: {
      title: 'Scan Failed', 
      message: 'Failed to start the configuration scan.',
      suggestions: [
        'Ensure you have a valid LLM profile configured',
        'Check that your API key is working (test connection in Settings)',
        'Verify the selected files are accessible',
        'Try scanning fewer files at once',
        'Check that Home Assistant files are readable'
      ]
    },
    suggestion: {
      title: 'Suggestion Update Failed',
      message: 'Failed to update the suggestion.',
      suggestions: ['Try refreshing the page', 'Check your network connection']
    },
    apply: {
      title: 'Apply Changes Failed',
      message: 'Failed to apply configuration changes.',
      suggestions: ['Check file permissions', 'Verify the configuration is still valid', 'Try again with a fresh scan']
    },
    llm_test: {
      title: 'LLM Connection Test Failed',
      message: 'Could not connect to the LLM provider.',
      suggestions: [
        'Verify your API key is correct and active',
        'Check that the endpoint URL is valid',
        'Ensure you have sufficient credits/quota',
        'Test your internet connection',
        'Try a different LLM provider if issues persist'
      ]
    },
    export: {
      title: 'Export Failed',
      message: 'Failed to export suggestions.',
      suggestions: ['Try a different format', 'Check browser permissions for downloads']
    }
  };

  const operationOverrides = operationMessages[operation];
  if (operationOverrides) {
    return {
      ...baseError,
      ...operationOverrides,
      suggestions: operationOverrides.suggestions || baseError.suggestions
    };
  }

  return baseError;
}

/**
 * Show an error message using the toast notification system
 */
export function showErrorToast(error: any, operation?: string, showRecovery = false) {
  const userError = operation ? getOperationError(operation, error) : parseApiError(error);
  
  // Import showToast dynamically to avoid circular dependencies
  import('../components/toast-notification.js').then(({ showToast }) => {
    showToast(userError.message, 'error');
    
    // Log additional details for debugging
    if (!userError.isUserError) {
      console.error(`${userError.title}:`, error);
    }
  });
  
  // Show error recovery panel for critical errors
  if (showRecovery || shouldShowRecoveryPanel(userError, operation)) {
    showErrorRecoveryPanel(userError);
  }
}

/**
 * Determine if the error recovery panel should be shown
 */
function shouldShowRecoveryPanel(userError: UserFriendlyError, operation?: string): boolean {
  // Show recovery panel for:
  // - API key related errors
  // - LLM configuration errors  
  // - Scan failures
  // - Connection issues
  return (
    userError.title.includes('API Key') ||
    userError.title.includes('LLM') ||
    userError.title.includes('Connection') ||
    operation === 'scan' ||
    operation === 'llm_test'
  );
}

/**
 * Show the error recovery panel
 */
function showErrorRecoveryPanel(userError: UserFriendlyError) {
  // Find the main app component and call its method
  const appElement = document.querySelector('ha-config-optimizer') as any;
  if (appElement && typeof appElement.showErrorRecoveryPanel === 'function') {
    appElement.showErrorRecoveryPanel(userError);
  }
}

/**
 * Format validation errors from Pydantic/FastAPI
 */
export function formatValidationError(error: any): string {
  if (error?.response?.data?.detail && Array.isArray(error.response.data.detail)) {
    const errors = error.response.data.detail.map((err: any) => {
      const field = err.loc ? err.loc.join('.') : 'field';
      return `${field}: ${err.msg}`;
    });
    return errors.join(', ');
  }
  
  return error?.response?.data?.detail || error?.message || 'Validation failed';
}