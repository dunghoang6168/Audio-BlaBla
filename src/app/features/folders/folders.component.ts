import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { FolderNode, MusicFolder, ScanProgress, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-folders',
  standalone: true,
  imports: [CommonModule, FormsModule, DurationPipe, IconComponent],
  template: `
    <div class="folders-page">
      <!-- Top Action Bar -->
      <header class="folders-header">
        <div class="title-group">
          <h1>Folders</h1>
          <p class="subtitle">Browse audio files directly by filesystem structure</p>
        </div>

        <div class="toolbar">
          <button
            type="button"
            class="btn-action primary"
            (click)="onStartScan()"
            [disabled]="scanProgress().isScanning"
            title="Scan library folders"
            aria-label="Scan library folders">
            <app-icon name="refresh-cw" [size]="16" class="scan-icon" [class.spinning]="scanProgress().isScanning" />
            {{ scanProgress().isScanning ? 'Scanning...' : 'Scan Library' }}
          </button>

          <button
            type="button"
            class="btn-action secondary"
            (click)="onAddFolder()"
            title="Add music folder"
            aria-label="Add music folder">
            <app-icon name="plus" [size]="16" />
            Add Folder
          </button>
        </div>
      </header>

      <!-- Live Scan Progress Card (Active when scanning) -->
      @if (scanProgress().isScanning || scanProgress().error) {
        <div class="scan-banner" [class.has-error]="scanProgress().error">
          <div class="scan-info">
            <div class="scan-title-row">
              <span class="scan-status-badge">
                {{ scanProgress().isScanning ? 'SCAN IN PROGRESS' : 'SCAN WARNING' }}
              </span>
              <span class="scan-stats">
                Scanned: <strong>{{ scanProgress().scannedFiles }}</strong> files &bull;
                Audio found: <strong>{{ scanProgress().audioFiles }}</strong> files
              </span>
            </div>

            @if (scanProgress().currentPath) {
              <div class="scan-current-path truncate" [title]="scanProgress().currentPath">
                {{ scanProgress().currentPath }}
              </div>
            }

            @if (scanProgress().error) {
              <div class="scan-error-msg">
                <app-icon name="alert-triangle" [size]="14" class="warning-icon" />
                <span>{{ scanProgress().error }}</span>
              </div>
            }
          </div>

          @if (scanProgress().isScanning) {
            <!-- Indeterminate Progress Animation (No fake percentage) -->
            <div class="indeterminate-bar">
              <div class="indeterminate-fill"></div>
            </div>
          }
        </div>
      }

      <!-- Music Root Tabs -->
      <div class="roots-bar">
        <span class="roots-label">MUSIC ROOTS:</span>
        <div class="roots-tabs">
          @for (root of roots(); track root.id) {
            <button
              type="button"
              class="root-tab"
              [class.active]="selectedRootId() === root.id"
              (click)="onSelectRoot(root)">
              <app-icon name="folder" [size]="14" />
              <span class="root-name truncate">{{ root.name }}</span>
            </button>
          }
        </div>

        @if (selectedRoot(); as root) {
          <button
            type="button"
            class="btn-remove-root"
            (click)="showRemoveDialog.set(true)"
            title="Remove folder from library">
            Remove Root
          </button>
        }
      </div>

      <!-- Breadcrumbs Navigation -->
      <nav class="breadcrumb-trail" aria-label="Folder Breadcrumb">
        @for (crumb of nodeStack(); track crumb.id; let idx = $index; let last = $last) {
          @if (!last) {
            <button type="button" class="crumb-btn" (click)="onNavigateBreadcrumb(idx)">
              {{ crumb.name }}
            </button>
            <span class="crumb-sep">/</span>
          } @else {
            <span class="crumb-current">{{ crumb.name }}</span>
          }
        }
      </nav>

      <!-- Current Folder Content Browser -->
      <div class="folder-content-view">
        @if (errorMessage()) {
          <div class="error-state" role="alert">
            <app-icon name="alert-triangle" [size]="48" />
            <p class="error-title">Folder Error</p>
            <p class="error-desc">{{ errorMessage() }}</p>
            <button type="button" class="btn-retry" (click)="loadRoots()">Retry</button>
          </div>
        } @else if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading folder contents...</p>
          </div>
        } @else if (!currentNode()) {
          <div class="empty-state">
            <app-icon name="folder" [size]="48" class="empty-icon" />
            <p>Select a music root above to browse folders.</p>
          </div>
        } @else {
          <!-- Subfolders List -->
          @if (subfolders().length > 0) {
            <div class="subfolders-grid">
              @for (folder of subfolders(); track folder.id) {
                <div class="folder-card" (click)="onEnterFolder(folder)" tabindex="0" role="button">
                  <div class="folder-icon-box">
                    <app-icon name="folder" [size]="28" />
                  </div>
                  <span class="folder-name truncate" [title]="folder.name">{{ folder.name }}</span>
                </div>
              }
            </div>
          }

          <!-- Audio Files List in Current Folder -->
          @if (filesInCurrentFolder().length > 0) {
            <div class="files-card">
              <div class="files-header">
                <h3>Files ({{ filesInCurrentFolder().length }})</h3>
                <button type="button" class="btn-play-folder" (click)="onPlayFolderFiles()" aria-label="Play All Files">
                  <app-icon name="play" [size]="14" />
                  Play All Files
                </button>
              </div>

              <table class="files-table">
                <thead>
                  <tr>
                    <th class="col-num">#</th>
                    <th class="col-title">File Name</th>
                    <th class="col-duration">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  @for (file of filesInCurrentFolder(); track file.id; let i = $index) {
                    <tr
                      class="file-row"
                      (dblclick)="onPlayFile(file)"
                      tabindex="0"
                      (keydown.enter)="onPlayFile(file)">
                      <td class="col-num">{{ i + 1 }}</td>
                      <td class="col-title">
                        <div class="file-name-cell">
                          <app-icon name="file-audio" [size]="16" class="music-icon" />
                          <span class="file-name truncate">{{ file.name }}</span>
                        </div>
                      </td>
                      <td class="col-duration">
                        {{ getTrackDuration(file.trackId) | duration }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (subfolders().length === 0 && filesInCurrentFolder().length === 0) {
            <div class="empty-folder">
              <p>This folder does not contain any audio files or subdirectories.</p>
            </div>
          }
        }
      </div>

      <!-- Remove Root Confirmation Dialog Modal -->
      @if (showRemoveDialog()) {
        <div class="modal-backdrop" (click)="showRemoveDialog.set(false)">
          <div class="modal-card danger" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="removeDialogTitle">
            <h3 id="removeDialogTitle">Remove Music Folder</h3>
            <p class="modal-desc">
              Are you sure you want to remove <strong>{{ selectedRoot()?.name }}</strong> from your library?
            </p>
            <div class="warning-box">
              <app-icon name="alert-triangle" [size]="16" class="warning-icon" />
              <span>
                <strong>Safe Operation:</strong> This only removes the folder index from Audio BlaBla.
                Your actual audio files on disk will <em>never</em> be deleted.
              </span>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="showRemoveDialog.set(false)">Cancel</button>
              <button type="button" class="btn-danger" (click)="onConfirmRemoveRoot()">Remove Folder</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .folders-page {
      padding: var(--space-6);
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .folders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .title-group h1 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
    }

    .subtitle {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-top: 2px;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .btn-action {
      height: 36px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      transition: background var(--transition-fast);
    }

    .btn-action.primary {
      background: var(--accent-primary);
      color: #ffffff;
    }

    .btn-action.primary:hover:not(:disabled) {
      background: var(--accent-hover);
    }

    .btn-action.secondary {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
    }

    .btn-action.secondary:hover {
      background: var(--bg-surface-hover);
    }

    .scan-icon.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Scan Progress Banner */
    .scan-banner {
      background: var(--color-accent-muted);
      border: 1px solid var(--color-accent);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .scan-banner.has-error {
      border-color: var(--status-warning);
      background: rgba(245, 158, 11, 0.1);
    }

    .scan-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .scan-status-badge {
      font-size: 10px;
      font-weight: 700;
      background: var(--accent-primary);
      color: #ffffff;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.05em;
    }

    .scan-stats {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }

    .scan-current-path {
      font-family: var(--font-family-mono);
      font-size: 11px;
      color: var(--text-muted);
    }

    .scan-error-msg {
      font-size: var(--font-size-xs);
      color: var(--status-warning);
    }

    .indeterminate-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      overflow: hidden;
      position: relative;
    }

    .indeterminate-fill {
      position: absolute;
      width: 40%;
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--radius-full);
      animation: indeterminate 1.5s infinite ease-in-out;
    }

    @keyframes indeterminate {
      0% { left: -40%; }
      100% { left: 100%; }
    }

    /* Roots bar */
    .roots-bar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: var(--space-3);
      overflow-x: auto;
    }

    .roots-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      flex-shrink: 0;
    }

    .roots-tabs {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      overflow-x: auto;
    }

    .root-tab {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      white-space: nowrap;
      transition: background var(--transition-fast), color var(--transition-fast);
    }

    .root-tab:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }

    .root-tab.active {
      background: var(--accent-muted);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      font-weight: 600;
    }

    .btn-remove-root {
      font-size: 11px;
      color: var(--text-muted);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .btn-remove-root:hover {
      color: var(--status-error);
      border-color: var(--status-error);
    }

    /* Breadcrumbs */
    .breadcrumb-trail {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
      font-size: var(--font-size-sm);
    }

    .crumb-btn {
      color: var(--accent-primary);
      font-weight: 500;
    }

    .crumb-btn:hover {
      text-decoration: underline;
    }

    .crumb-sep {
      color: var(--text-muted);
    }

    .crumb-current {
      color: var(--text-primary);
      font-weight: 600;
    }

    /* Content view */
    .folder-content-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .subfolders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-3);
    }

    .folder-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      transition: transform var(--transition-fast), background var(--transition-fast);
    }

    .folder-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-2px);
    }

    .folder-icon-box {
      color: var(--accent-primary);
    }

    .folder-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .files-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .files-header {
      padding: var(--space-3) var(--space-4);
      background: var(--bg-elevated);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
    }

    .files-header h3 {
      font-size: var(--font-size-sm);
      font-weight: 700;
    }

    .btn-play-folder {
      font-size: var(--font-size-xs);
      font-weight: 600;
      background: var(--accent-primary);
      color: #ffffff;
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
    }

    .files-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    .files-table th {
      padding: var(--space-2) var(--space-4);
      color: var(--text-muted);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
    }

    .file-row {
      height: 40px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
    }

    .file-row:hover {
      background: var(--bg-surface-hover);
    }

    .files-table td {
      padding: var(--space-1) var(--space-4);
      vertical-align: middle;
    }

    .col-num { width: 40px; text-align: center; color: var(--text-muted); }
    .col-title { min-width: 250px; }
    .col-duration { width: 80px; font-family: var(--font-family-mono); color: var(--text-muted); }

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .music-icon {
      color: var(--text-muted);
    }

    .empty-folder {
      padding: var(--space-6);
      text-align: center;
      color: var(--text-muted);
      font-size: var(--font-size-sm);
    }

    /* Modal Dialogs */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: var(--space-4);
    }

    .modal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-lg);
    }

    .modal-card h3 {
      font-size: var(--font-size-lg);
      font-weight: 700;
      margin-bottom: var(--space-2);
    }

    .modal-desc {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--space-4);
    }

    .folder-options {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
    }

    .folder-option-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
    }

    .folder-option-item:hover {
      border-color: var(--accent-primary);
    }

    .option-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .option-name {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .option-path {
      font-size: 11px;
      font-family: var(--font-family-mono);
      color: var(--text-muted);
    }

    .warning-box {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid var(--status-warning);
      color: #fef08a;
      padding: var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      margin-bottom: var(--space-6);
    }

    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .btn-cancel {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-weight: 500;
    }

    .btn-cancel:hover { color: var(--text-primary); }

    .btn-confirm {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 600;
    }

    .btn-confirm:hover { background: var(--accent-hover); }

    .btn-danger {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--status-error);
      color: #ffffff;
      font-weight: 600;
    }

    .loading-state, .empty-state, .error-state {
      padding: var(--space-10);
      text-align: center;
      color: var(--text-muted);
    }

    .error-state svg {
      stroke: var(--status-error);
      margin-bottom: var(--space-3);
    }

    .error-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .error-desc {
      font-size: var(--font-size-sm);
      color: var(--status-error);
      margin-bottom: var(--space-4);
    }

    .btn-retry {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      font-weight: 500;
      cursor: pointer;
    }

    .btn-retry:hover {
      background: var(--bg-card);
      border-color: var(--accent-primary);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 800ms linear infinite;
      margin: 0 auto var(--space-3);
    }
  `]
})
export class FoldersComponent implements OnInit, OnDestroy {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);
  private readonly sub = new Subscription();

  readonly roots = signal<MusicFolder[]>([]);
  readonly selectedRootId = signal<string | null>(null);
  readonly nodeStack = signal<FolderNode[]>([]);
  readonly allTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Scan State
  readonly scanProgress = signal<ScanProgress>({
    isScanning: false,
    scannedFiles: 0,
    audioFiles: 0,
    currentPath: null,
  });

  // Modal Dialogs
  readonly showRemoveDialog = signal<boolean>(false);

  selectedRoot = () => this.roots().find((r) => r.id === this.selectedRootId()) || null;
  currentNode = () => {
    const stack = this.nodeStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  };
  subfolders = () => {
    const curr = this.currentNode();
    return curr?.children?.filter((c) => c.isFolder) || [];
  };
  filesInCurrentFolder = () => {
    const curr = this.currentNode();
    return curr?.children?.filter((c) => !c.isFolder) || [];
  };

  async ngOnInit(): Promise<void> {
    let wasScanning = false;
    this.sub.add(
      this.libraryGateway.scanProgress$.subscribe(async (prog) => {
        const justFinished = wasScanning && !prog.isScanning;
        wasScanning = prog.isScanning;
        this.scanProgress.set(prog);

        if (justFinished) {
          await this.loadRoots();
        }
      })
    );

    await this.loadRoots();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async loadRoots(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.roots.set(lib.folders);
      this.allTracks.set(lib.tracks);

      if (lib.folders.length > 0) {
        const rootToSelect = this.selectedRootId()
          ? lib.folders.find((f) => f.id === this.selectedRootId()) || lib.folders[0]
          : lib.folders[0];
        await this.onSelectRoot(rootToSelect);
      } else {
        this.nodeStack.set([]);
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load music folders');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSelectRoot(root: MusicFolder): Promise<void> {
    this.selectedRootId.set(root.id);
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const tree = await this.libraryGateway.getFolderTree(root.id);
      if (tree) {
        this.nodeStack.set([tree]);
      } else {
        this.nodeStack.set([]);
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || `Failed to load folder tree for ${root.name}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  onEnterFolder(node: FolderNode): void {
    this.nodeStack.update((stack) => [...stack, node]);
  }

  onNavigateBreadcrumb(index: number): void {
    this.nodeStack.update((stack) => stack.slice(0, index + 1));
  }

  async onStartScan(): Promise<void> {
    const root = this.selectedRoot();
    this.errorMessage.set(null);
    try {
      await this.libraryGateway.requestScan(root ? [root.id] : undefined);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to request scan');
    }
  }

  async onAddFolder(): Promise<void> {
    this.errorMessage.set(null);
    try {
      const selected = await this.libraryGateway.selectAndAddMusicFolders();
      if (selected && selected.length > 0) {
        await this.loadRoots();
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to select or add folder');
    }
  }

  async onConfirmRemoveRoot(): Promise<void> {
    const rootId = this.selectedRootId();
    if (!rootId) return;

    try {
      await this.libraryGateway.removeMusicFolder(rootId);
      this.showRemoveDialog.set(false);
      this.selectedRootId.set(null);
      await this.loadRoots();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to remove folder');
    }
  }

  onPlayFile(fileNode: FolderNode): void {
    if (!fileNode.trackId) return;
    const track = this.allTracks().find((t) => t.id === fileNode.trackId);
    if (track && track.isAvailable) {
      this.player.playTrack(track);
    }
  }

  onPlayFolderFiles(): void {
    const files = this.filesInCurrentFolder();
    const trackMap = new Map<string, Track>();
    this.allTracks().forEach((t) => trackMap.set(t.id, t));

    const tracks: Track[] = [];
    files.forEach((f) => {
      if (f.trackId) {
        const t = trackMap.get(f.trackId);
        if (t) tracks.push(t);
      }
    });

    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }

  getTrackDuration(trackId?: string | null): number {
    if (!trackId) return 0;
    const t = this.allTracks().find((track) => track.id === trackId);
    return t ? t.duration : 0;
  }
}
