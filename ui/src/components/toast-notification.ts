import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

@customElement('toast-notification')
export class ToastNotification extends LitElement {
  @state()
  private toasts: ToastMessage[] = [];

  static styles = css`
    :host {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    }

    .toast-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
    }

    .toast {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 16px 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 500px;
      pointer-events: all;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid;
    }

    .toast.success {
      border-left-color: var(--optimizer-success, #00c875);
    }

    .toast.error {
      border-left-color: var(--optimizer-error, #d32f2f);
    }

    .toast.warning {
      border-left-color: var(--optimizer-warning, #f57f17);
    }

    .toast.info {
      border-left-color: var(--primary-color, #03a9f4);
    }

    .toast.removing {
      animation: slideOut 0.3s ease-in forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .toast.success .toast-icon {
      color: var(--optimizer-success, #00c875);
    }

    .toast.error .toast-icon {
      color: var(--optimizer-error, #d32f2f);
    }

    .toast.warning .toast-icon {
      color: var(--optimizer-warning, #f57f17);
    }

    .toast.info .toast-icon {
      color: var(--primary-color, #03a9f4);
    }

    .toast-message {
      flex: 1;
      color: var(--primary-text-color, #212121);
      font-size: 14px;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--secondary-text-color, #757575);
      font-size: 18px;
      line-height: 1;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .toast-close:hover {
      background-color: var(--divider-color, #e0e0e0);
    }

    @media (max-width: 600px) {
      :host {
        left: 20px;
        right: 20px;
      }

      .toast {
        min-width: auto;
        width: 100%;
      }
    }
  `;

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  }

  show(message: string, type: ToastType = 'info', duration = 5000) {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, message, type, duration };
    
    this.toasts = [...this.toasts, toast];

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  private remove(id: string) {
    const toastElement = this.shadowRoot?.querySelector(`[data-id="${id}"]`);
    if (toastElement) {
      toastElement.classList.add('removing');
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 300);
    } else {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }

  render() {
    return html`
      <div class="toast-container">
        ${this.toasts.map(toast => html`
          <div class="toast ${toast.type}" data-id="${toast.id}">
            <span class="toast-icon">${this.getIcon(toast.type)}</span>
            <span class="toast-message">${toast.message}</span>
            <button class="toast-close" @click=${() => this.remove(toast.id)}>
              ✕
            </button>
          </div>
        `)}
      </div>
    `;
  }
}

// Global toast instance and helper function
let globalToast: ToastNotification | null = null;

export function showToast(message: string, type: ToastType = 'info', duration = 5000) {
  if (!globalToast) {
    globalToast = document.createElement('toast-notification') as ToastNotification;
    document.body.appendChild(globalToast);
  }
  globalToast.show(message, type, duration);
}

declare global {
  interface HTMLElementTagNameMap {
    'toast-notification': ToastNotification;
  }
}