import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  lineNumber: number;
  content: string;
}

export interface DiffSection {
  title: string;
  before: string;
  after: string;
  filePath: string;
}

@customElement('diff-viewer')
export class DiffViewer extends LitElement {
  @property({ type: Object })
  diffSection: DiffSection | null = null;

  @property({ type: Boolean })
  showSideBySide = true;

  @state()
  private diffLines: DiffLine[] = [];

  static styles = css`
    :host {
      display: block;
      font-family: var(--font-family-code, 'Roboto Mono', monospace);
      font-size: 14px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      background: var(--card-background-color, #ffffff);
    }

    .diff-header {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .diff-title {
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .diff-toggle {
      background: none;
      border: 1px solid var(--primary-color, #03a9f4);
      color: var(--primary-color, #03a9f4);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .diff-toggle:hover {
      background: var(--primary-color, #03a9f4);
      color: white;
    }

    .diff-content {
      max-height: 400px;
      overflow-y: auto;
    }

    .diff-side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .diff-side {
      position: relative;
    }

    .diff-side::before {
      content: attr(data-title);
      position: sticky;
      top: 0;
      display: block;
      padding: 8px 12px;
      background: var(--secondary-background-color, #f5f5f5);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-weight: 500;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      z-index: 1;
    }

    .diff-side.before::before {
      background: #fdf2f2;
      color: #d32f2f;
    }

    .diff-side.after::before {
      background: #f0f9f0;
      color: #2e7d32;
    }

    .diff-unified {
      display: block;
    }

    .diff-line {
      display: flex;
      font-family: inherit;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .diff-line-number {
      display: inline-block;
      width: 40px;
      padding: 2px 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-right: 1px solid var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #757575);
      font-size: 11px;
      text-align: right;
      user-select: none;
      flex-shrink: 0;
    }

    .diff-line-content {
      padding: 2px 8px;
      flex: 1;
      min-width: 0;
    }

    .diff-line.add {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .diff-line.add .diff-line-number {
      background: #d4edda;
      border-color: #c3e6cb;
    }

    .diff-line.add .diff-line-content::before {
      content: "+ ";
      color: #2e7d32;
      font-weight: bold;
    }

    .diff-line.remove {
      background: #fdeaea;
      color: #d32f2f;
    }

    .diff-line.remove .diff-line-number {
      background: #f8d7da;
      border-color: #f1c2c7;
    }

    .diff-line.remove .diff-line-content::before {
      content: "- ";
      color: #d32f2f;
      font-weight: bold;
    }

    .diff-line.context {
      background: var(--card-background-color, #ffffff);
      color: var(--primary-text-color, #212121);
    }

    .diff-line.context .diff-line-content::before {
      content: "  ";
    }

    .code-block {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 12px;
      margin: 4px 0;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.4;
    }

    .empty-state {
      padding: 40px;
      text-align: center;
      color: var(--secondary-text-color, #757575);
    }

    @media (max-width: 768px) {
      .diff-side-by-side {
        grid-template-columns: 1fr;
      }
      
      .diff-toggle {
        display: none;
      }
    }
  `;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('diffSection') && this.diffSection) {
      this.generateDiffLines();
    }
  }

  private generateDiffLines() {
    if (!this.diffSection) {
      this.diffLines = [];
      return;
    }

    const { before, after } = this.diffSection;
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    
    // Simple diff algorithm - can be enhanced with proper diff library
    const lines: DiffLine[] = [];
    
    // For now, show all "before" lines as removed and "after" lines as added
    beforeLines.forEach((line, index) => {
      lines.push({
        type: 'remove',
        lineNumber: index + 1,
        content: line
      });
    });
    
    afterLines.forEach((line, index) => {
      lines.push({
        type: 'add',
        lineNumber: index + 1,
        content: line
      });
    });
    
    this.diffLines = lines;
  }

  private toggleView() {
    this.showSideBySide = !this.showSideBySide;
  }

  private renderSideBySide() {
    if (!this.diffSection) return html``;

    return html`
      <div class="diff-side-by-side">
        <div class="diff-side before" data-title="Before">
          <div class="code-block">${this.diffSection.before}</div>
        </div>
        <div class="diff-side after" data-title="After">  
          <div class="code-block">${this.diffSection.after}</div>
        </div>
      </div>
    `;
  }

  private renderUnified() {
    return html`
      <div class="diff-unified">
        ${this.diffLines.map(line => html`
          <div class="diff-line ${line.type}">
            <span class="diff-line-number">${line.lineNumber}</span>
            <span class="diff-line-content">${line.content}</span>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    if (!this.diffSection) {
      return html`
        <div class="empty-state">
          <p>No diff to display</p>
        </div>
      `;
    }

    return html`
      <div class="diff-header">
        <span class="diff-title">${this.diffSection.title}</span>
        <button class="diff-toggle" @click=${this.toggleView}>
          ${this.showSideBySide ? 'Unified View' : 'Side by Side'}
        </button>
      </div>
      <div class="diff-content">
        ${this.showSideBySide ? this.renderSideBySide() : this.renderUnified()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'diff-viewer': DiffViewer;
  }
}