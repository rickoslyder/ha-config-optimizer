import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { apiService } from '../services/api.js';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  lastModified?: string;
}

@customElement('file-selector')
export class FileSelector extends LitElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Array })
  selectedFiles: string[] = [];

  @state()
  private fileTree: FileNode[] = [];

  @state()
  private loading = false;

  @state()
  private expandedDirs = new Set<string>();

  @state()
  private checkedFiles = new Set<string>();

  static styles = css`
    :host {
      display: block;
    }

    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.open {
      display: flex;
    }

    .modal {
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--secondary-text-color, #757575);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background-color: var(--secondary-background-color, #f5f5f5);
    }

    .file-controls {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }

    .control-button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #ffffff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .control-button:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .file-tree {
      flex: 1;
      overflow-y: auto;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      padding: 12px;
    }

    .tree-node {
      margin-bottom: 4px;
    }

    .node-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .node-content:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .node-expand {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
    }

    .node-expand.empty {
      visibility: hidden;
    }

    .node-checkbox {
      margin: 0;
    }

    .node-icon {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
    }

    .node-name {
      flex: 1;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }

    .node-meta {
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
    }

    .node-children {
      margin-left: 24px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--secondary-text-color, #757575);
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--secondary-text-color, #757575);
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }

    .selected-count {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
    }

    .footer-buttons {
      display: flex;
      gap: 12px;
    }

    .button {
      background: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 12px 24px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .button.secondary {
      background: transparent;
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .button.secondary:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.open) {
      this.loadFileTree();
    }
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('open') && this.open) {
      this.loadFileTree();
    }
    if (changedProperties.has('selectedFiles')) {
      this.checkedFiles = new Set(this.selectedFiles);
    }
  }

  private async loadFileTree() {
    this.loading = true;
    try {
      const data = await apiService.getFileTree();
      this.fileTree = data.files || [];
    } catch (error) {
      console.error('Failed to load file tree:', error);
      this.fileTree = [];
    } finally {
      this.loading = false;
    }
  }

  private toggleDirectory(path: string) {
    if (this.expandedDirs.has(path)) {
      this.expandedDirs.delete(path);
    } else {
      this.expandedDirs.add(path);
    }
    this.requestUpdate();
  }

  private toggleFile(path: string, checked: boolean) {
    if (checked) {
      this.checkedFiles.add(path);
    } else {
      this.checkedFiles.delete(path);
    }
    this.requestUpdate();
  }

  private selectAll() {
    const allFiles = this.getAllFiles(this.fileTree);
    this.checkedFiles = new Set(allFiles);
    this.requestUpdate();
  }

  private clearAll() {
    this.checkedFiles.clear();
    this.requestUpdate();
  }

  private selectYamlOnly() {
    const yamlFiles = this.getAllFiles(this.fileTree).filter(
      path => path.endsWith('.yaml') || path.endsWith('.yml')
    );
    this.checkedFiles = new Set(yamlFiles);
    this.requestUpdate();
  }

  private getAllFiles(nodes: FileNode[]): string[] {
    const files: string[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        files.push(node.path);
      } else if (node.children) {
        files.push(...this.getAllFiles(node.children));
      }
    }
    return files;
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private handleConfirm() {
    const selectedFiles = Array.from(this.checkedFiles);
    this.dispatchEvent(new CustomEvent('confirm', {
      detail: { selectedFiles }
    }));
  }

  private formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  private renderNode(node: FileNode, level = 0): any {
    const isExpanded = this.expandedDirs.has(node.path);
    const isChecked = this.checkedFiles.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    return html`
      <div class="tree-node">
        <div class="node-content" style="padding-left: ${level * 16}px">
          <span 
            class="node-expand ${hasChildren ? '' : 'empty'}"
            @click=${() => hasChildren && this.toggleDirectory(node.path)}
          >
            ${hasChildren ? (isExpanded ? '▼' : '▶') : ''}
          </span>
          
          ${node.type === 'file' ? html`
            <input
              type="checkbox"
              class="node-checkbox"
              .checked=${isChecked}
              @change=${(e: Event) => 
                this.toggleFile(node.path, (e.target as HTMLInputElement).checked)
              }
            />
          ` : ''}
          
          <span class="node-icon">
            ${node.type === 'directory' ? '📁' : 
              node.name.endsWith('.yaml') || node.name.endsWith('.yml') ? '📄' : '📄'}
          </span>
          
          <span class="node-name">${node.name}</span>
          
          ${node.size ? html`
            <span class="node-meta">${this.formatFileSize(node.size)}</span>
          ` : ''}
        </div>
        
        ${hasChildren && isExpanded ? html`
          <div class="node-children">
            ${node.children!.map(child => this.renderNode(child, level + 1))}
          </div>
        ` : ''}
      </div>
    `;
  }

  render() {
    const selectedCount = this.checkedFiles.size;

    return html`
      <div class="modal-overlay ${this.open ? 'open' : ''}" @click=${(e: Event) => {
        if (e.target === e.currentTarget) this.handleClose();
      }}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Select Files to Scan</h2>
            <button class="close-button" @click=${this.handleClose}>×</button>
          </div>

          <div class="file-controls">
            <button class="control-button" @click=${this.selectAll}>
              Select All
            </button>
            <button class="control-button" @click=${this.clearAll}>
              Clear All
            </button>
            <button class="control-button" @click=${this.selectYamlOnly}>
              YAML Files Only
            </button>
          </div>

          <div class="file-tree">
            ${this.loading ? html`
              <div class="loading">
                <div>⏳ Loading files...</div>
              </div>
            ` : this.fileTree.length === 0 ? html`
              <div class="empty-state">
                <div>📁 No files found</div>
                <p>Make sure your Home Assistant configuration is accessible.</p>
              </div>
            ` : html`
              ${this.fileTree.map(node => this.renderNode(node))}
            `}
          </div>

          <div class="modal-footer">
            <div class="selected-count">
              ${selectedCount} file${selectedCount !== 1 ? 's' : ''} selected
            </div>
            <div class="footer-buttons">
              <button class="button secondary" @click=${this.handleClose}>
                Cancel
              </button>
              <button 
                class="button" 
                @click=${this.handleConfirm}
                ?disabled=${selectedCount === 0}
              >
                Scan Selected Files
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'file-selector': FileSelector;
  }
}