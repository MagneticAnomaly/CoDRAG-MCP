import * as vscode from 'vscode';
import { CodragDaemonClient } from '../client';
import { DaemonManager } from '../daemon';
import type { FileTreeNode } from '../types';

export class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly node: FileTreeNode,
    public readonly projectId: string,
    public readonly parentPath: string,
  ) {
    super(
      node.name,
      node.type === 'folder'
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );

    const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

    if (node.type === 'file') {
      this.contextValue = 'file';
      this.iconPath = vscode.ThemeIcon.File;
      this.resourceUri = vscode.Uri.file(fullPath);
      this.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [vscode.Uri.file(fullPath)],
      };
    } else {
      this.contextValue = 'folder';
      this.iconPath = vscode.ThemeIcon.Folder;
    }

    this.tooltip = fullPath;
  }

  get fullPath(): string {
    return this.parentPath ? `${this.parentPath}/${this.node.name}` : this.node.name;
  }
}

export class FileTreeDataProvider implements vscode.TreeDataProvider<FileTreeItem> {
  private _client: CodragDaemonClient;
  private readonly _daemon: DaemonManager;
  private _projectId: string | undefined;
  private _projectPath: string | undefined;
  private _roots: FileTreeNode[] = [];

  private readonly _onDidChangeTreeData = new vscode.EventEmitter<FileTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(client: CodragDaemonClient, daemon: DaemonManager) {
    this._client = client;
    this._daemon = daemon;

    daemon.onStateChange(() => {
      if (daemon.state !== 'connected') {
        this._roots = [];
        this._onDidChangeTreeData.fire(undefined);
      }
    });
  }

  updateClient(client: CodragDaemonClient): void {
    this._client = client;
    this.refresh();
  }

  setProject(projectId: string, projectPath: string): void {
    this._projectId = projectId;
    this._projectPath = projectPath;
    this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this._projectId || this._daemon.state !== 'connected') {
      this._roots = [];
      this._onDidChangeTreeData.fire(undefined);
      return;
    }

    try {
      const resp = await this._client.getProjectFiles(this._projectId, '', 2);
      this._roots = resp.tree;
    } catch {
      this._roots = [];
    }

    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
    if (!this._projectId || this._daemon.state !== 'connected') {
      if (!this._projectId) {
        const item = new vscode.TreeItem('Select a project first');
        item.iconPath = new vscode.ThemeIcon('info');
        return [item as unknown as FileTreeItem];
      }
      return [];
    }

    if (!element) {
      // Root level
      return this._roots.map(
        (node) => new FileTreeItem(node, this._projectId!, this._projectPath ?? ''),
      );
    }

    // Child level — use the node's children if available
    if (element.node.children) {
      return element.node.children.map(
        (child) => new FileTreeItem(child, this._projectId!, element.fullPath),
      );
    }

    // Lazy load children from the daemon
    try {
      const relativePath = element.fullPath.replace(this._projectPath ?? '', '').replace(/^\//, '');
      const resp = await this._client.getProjectFiles(this._projectId!, relativePath, 2);
      return resp.tree.map(
        (child) => new FileTreeItem(child, this._projectId!, element.fullPath),
      );
    } catch {
      return [];
    }
  }
}
