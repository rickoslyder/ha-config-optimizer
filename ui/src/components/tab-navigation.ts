import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type TabId = 'optimizations' | 'automations' | 'diffs' | 'logs' | 'settings';

export interface Tab {
  id: TabId;
  label: string;
  icon?: string;
}

const DEFAULT_TABS: Tab[] = [
  { id: 'optimizations', label: 'Optimizations', icon: '🔧' },
  { id: 'automations', label: 'Automations', icon: '⚡' },
  { id: 'diffs', label: 'Diffs', icon: '📝' },
  { id: 'logs', label: 'Logs', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

@customElement('tab-navigation')
export class TabNavigation extends LitElement {
  @property({ type: Array })
  tabs: Tab[] = DEFAULT_TABS;

  @property({ type: String })
  activeTab: TabId = 'optimizations';

  static styles = css`
    :host {
      display: block;
      background: var(--card-background-color, #ffffff);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }

    .tab-bar {
      display: flex;
      overflow-x: auto;
      padding: 0 16px;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px;
      border: none;
      background: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      white-space: nowrap;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
      font-size: 14px;
      font-weight: 500;
    }

    .tab:hover {
      color: var(--primary-text-color, #212121);
      background: var(--secondary-background-color, #f5f5f5);
    }

    .tab.active {
      color: var(--primary-color, #03a9f4);
      border-bottom-color: var(--primary-color, #03a9f4);
    }

    .tab-icon {
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .tab {
        padding: 12px 16px;
        font-size: 12px;
      }
      
      .tab-label {
        display: none;
      }
    }
  `;

  private handleTabClick(tabId: TabId) {
    this.activeTab = tabId;
    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: { tabId },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="tab-bar">
        ${this.tabs.map(tab => html`
          <button
            class="tab ${tab.id === this.activeTab ? 'active' : ''}"
            @click=${() => this.handleTabClick(tab.id)}
          >
            ${tab.icon && html`<span class="tab-icon">${tab.icon}</span>`}
            <span class="tab-label">${tab.label}</span>
          </button>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tab-navigation': TabNavigation;
  }
}