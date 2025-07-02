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
    // Handle specific error codes
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'ECONNREFUSED':
        result = {
          title: 'Connection Failed',
          message: 'Could not connect to the server. Please check your connection.',
          suggestions: ['Check your network connection', 'Verify the server is running'],
          isUserError: false
        };
        break;

      case 'TIMEOUT':
        result = {
          title: 'Request Timeout',
          message: 'The request took too long to complete.',
          suggestions: ['Try again with fewer files', 'Check your network connection'],
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
      suggestions: ['Check that files are accessible', 'Try selecting fewer files', 'Verify your LLM configuration']
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
      suggestions: ['Check your API key', 'Verify the endpoint URL', 'Check your internet connection']
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
export function showErrorToast(error: any, operation?: string) {
  const userError = operation ? getOperationError(operation, error) : parseApiError(error);
  
  // Import showToast dynamically to avoid circular dependencies
  import('../components/toast-notification.js').then(({ showToast }) => {
    showToast(userError.message, 'error');
    
    // Log additional details for debugging
    if (!userError.isUserError) {
      console.error(`${userError.title}:`, error);
    }
  });
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