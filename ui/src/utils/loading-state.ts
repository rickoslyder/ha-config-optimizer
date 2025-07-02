/**
 * Loading state management utilities for async operations.
 */

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  startTime?: number;
}

export class LoadingManager {
  private states = new Map<string, LoadingState>();
  private updateCallback?: () => void;

  constructor(updateCallback?: () => void) {
    this.updateCallback = updateCallback;
  }

  start(key: string, operation?: string): void {
    this.states.set(key, {
      isLoading: true,
      operation,
      startTime: Date.now()
    });
    this.updateCallback?.();
  }

  stop(key: string): void {
    const state = this.states.get(key);
    if (state) {
      const duration = Date.now() - (state.startTime || 0);
      console.log(`Operation "${state.operation || key}" completed in ${duration}ms`);
    }
    this.states.delete(key);
    this.updateCallback?.();
  }

  isLoading(key: string): boolean {
    return this.states.get(key)?.isLoading || false;
  }

  getOperation(key: string): string | undefined {
    return this.states.get(key)?.operation;
  }

  isAnyLoading(): boolean {
    return Array.from(this.states.values()).some(state => state.isLoading);
  }

  getLoadingKeys(): string[] {
    return Array.from(this.states.keys()).filter(key => this.states.get(key)?.isLoading);
  }

  clear(): void {
    this.states.clear();
    this.updateCallback?.();
  }
}

/**
 * Decorator function to automatically manage loading states
 */
export function withLoading<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  loadingManager: LoadingManager,
  key: string,
  operation?: string
): T {
  return (async (...args: any[]) => {
    loadingManager.start(key, operation);
    try {
      return await fn(...args);
    } finally {
      loadingManager.stop(key);
    }
  }) as T;
}

/**
 * Loading spinner component styles (CSS-in-JS)
 */
export const loadingSpinnerStyles = `
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--divider-color, #e0e0e0);
    border-top: 2px solid var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-spinner.large {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }

  .loading-button {
    position: relative;
    overflow: hidden;
  }

  .loading-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

/**
 * Loading button HTML template
 */
export function loadingButton(
  text: string, 
  loadingText: string, 
  isLoading: boolean, 
  className: string = 'button',
  disabled: boolean = false
): string {
  return `
    <button 
      class="${className} ${isLoading ? 'loading-button' : ''}" 
      ${disabled || isLoading ? 'disabled' : ''}
    >
      ${isLoading ? `
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        ${loadingText}
      ` : text}
    </button>
  `;
}

/**
 * Loading state for cards/sections
 */
export function loadingCard(message: string = 'Loading...'): string {
  return `
    <div class="loading-card" style="
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
    ">
      <div class="loading-spinner large" style="margin-right: 12px;"></div>
      <span style="color: var(--secondary-text-color, #757575);">${message}</span>
    </div>
  `;
}