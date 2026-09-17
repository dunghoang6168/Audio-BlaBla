import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY, SETTINGS_GATEWAY } from '../../core/contracts';
import { MusicFolder, RepeatMode, Settings } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <header class="settings-header">
        <h1>Settings</h1>
        <p class="subtitle">Configure library folders, playback preferences, and review integration state</p>
      </header>

      @if (errorMessage()) {
        <div class="error-notice-card" role="alert">
          <div class="notice-icon error">⚠️</div>
          <div class="notice-content">
            <h3>Settings Error</h3>
            <p>{{ errorMessage() }}</p>
          </div>
          <button type="button" class="btn-dismiss-err" (click)="errorMessage.set(null)">&times;</button>
        </div>
      }

      <!-- Phase 1 Integration / Persistence Notice -->
      <div class="integration-notice-card">
        <div class="notice-icon">ℹ</div>
        <div class="notice-content">
          <h3>Phase 1 Mock Environment (Browser Mode)</h3>
          <p>
            Settings, folder modifications and playlists are currently preserved in-memory across route navigation.
            Reloading the browser resets them to fixture defaults.
            Native OS folder picker, background file scanner, and persistent SQLite database will be connected in <strong>Phase 2</strong>.
          </p>
        </div>
      </div>

      <div class="settings-sections">
        <!-- Section 1: Music Folders & Library Management -->
        <section class="settings-card">
          <div class="card-header">
            <h2>Music Library Folders</h2>
            <span class="card-desc">Directories scanned for audio files and metadata</span>
          </div>

          <div class="folders-list">
            @for (folder of folders(); track folder.id) {
              <div class="folder-row">
                <div class="folder-info">
                  <span class="folder-name">{{ folder.name }}</span>
                  <span class="folder-path truncate" [title]="folder.path">{{ folder.path }}</span>
                </div>
                <button
                  type="button"
                  class="btn-remove-folder"
                  (click)="onRemoveFolder(folder.id)"
                  title="Remove folder from library">
                  Remove
                </button>
              </div>
            }
          </div>

          <div class="folder-actions">
            <button type="button" class="btn-primary" (click)="onAddFolder()">
              + Add Music Folder
            </button>
            <button type="button" class="btn-secondary" (click)="onRescanLibrary()">
              Rescan All Folders
            </button>
          </div>
        </section>

        <!-- Section 2: Audio Playback Preferences -->
        <section class="settings-card">
          <div class="card-header">
            <h2>Playback Preferences</h2>
            <span class="card-desc">Default behavior for audio controls</span>
          </div>

          <div class="pref-rows">
            <!-- Default Volume -->
            <div class="pref-row">
              <div class="pref-label">
                <span class="pref-title">Default Volume</span>
                <span class="pref-desc">Audio volume when starting the player</span>
              </div>
              <div class="pref-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  [ngModel]="player.volume()"
                  (ngModelChange)="onVolumeChange($event)"
                  class="volume-slider" />
                <span class="pref-val">{{ (player.volume() * 100) | number:'1.0-0' }}%</span>
              </div>
            </div>

            <!-- Repeat Mode Default -->
            <div class="pref-row">
              <div class="pref-label">
                <span class="pref-title">Repeat Mode</span>
                <span class="pref-desc">Queue looping behavior upon track completion</span>
              </div>
              <div class="pref-control">
                <select [ngModel]="player.repeatMode()" (ngModelChange)="onRepeatChange($event)" class="select-box">
                  <option value="off">Off (Stop at end of queue)</option>
                  <option value="all">Repeat All (Cycle entire queue)</option>
                  <option value="one">Repeat One (Loop single track)</option>
                </select>
              </div>
            </div>

            <!-- Shuffle Default -->
            <div class="pref-row">
              <div class="pref-label">
                <span class="pref-title">Shuffle Mode</span>
                <span class="pref-desc">Randomize track playback order</span>
              </div>
              <div class="pref-control">
                <button
                  type="button"
                  class="btn-toggle"
                  [class.active]="player.isShuffle()"
                  (click)="player.toggleShuffle()">
                  {{ player.isShuffle() ? 'Shuffle ON' : 'Shuffle OFF' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: About & Architecture -->
        <section class="settings-card">
          <div class="card-header">
            <h2>About Audio BlaBla</h2>
            <span class="card-desc">Technical specification & build info</span>
          </div>

          <div class="about-grid">
            <div class="about-item">
              <span class="about-label">Frontend Framework</span>
              <span class="about-value">Angular 21 (Standalone, Signals)</span>
            </div>
            <div class="about-item">
              <span class="about-label">Language</span>
              <span class="about-value">TypeScript 5.9 (Strict Mode)</span>
            </div>
            <div class="about-item">
              <span class="about-label">Styles & Icons</span>
              <span class="about-value">SCSS, CSS Variables, Native SVG</span>
            </div>
            <div class="about-item">
              <span class="about-label">State Management</span>
              <span class="about-value">Angular Signals & Computed (No NgRx)</span>
            </div>
            <div class="about-item">
              <span class="about-label">Integration Phase</span>
              <span class="about-value">Phase 1 Complete (Mock Adapters)</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      padding: var(--space-8);
      height: 100%;
      overflow-y: auto;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .settings-header h1 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
    }

    .subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    /* Error notice */
    .error-notice-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--status-error);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      position: relative;
    }

    .notice-icon.error {
      background: var(--status-error);
    }

    .error-notice-card .notice-content h3 {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--status-error);
      margin-bottom: var(--space-1);
    }

    .btn-dismiss-err {
      margin-left: auto;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: var(--font-size-lg);
      cursor: pointer;
      line-height: 1;
    }

    .btn-dismiss-err:hover { color: var(--text-primary); }

    /* Integration notice */
    .integration-notice-card {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid var(--accent-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .notice-icon {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .notice-content h3 {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--accent-primary);
      margin-bottom: var(--space-1);
    }

    .notice-content p {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .settings-sections {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }

    .card-header {
      margin-bottom: var(--space-4);
    }

    .card-header h2 {
      font-size: var(--font-size-md);
      font-weight: 700;
    }

    .card-desc {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .folders-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .folder-row {
      background: var(--bg-elevated);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .folder-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .folder-name {
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .folder-path {
      font-size: 11px;
      font-family: var(--font-family-mono);
      color: var(--text-muted);
    }

    .btn-remove-folder {
      font-size: var(--font-size-xs);
      color: var(--status-error);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      border: 1px solid rgba(239, 68, 68, 0.3);
      background: transparent;
      flex-shrink: 0;
    }

    .btn-remove-folder:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .folder-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .btn-primary {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .btn-primary:hover { background: var(--accent-hover); }

    .btn-secondary {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .btn-secondary:hover { background: var(--bg-surface-hover); }

    /* Prefs */
    .pref-rows {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .pref-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-subtle);
    }

    .pref-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .pref-label {
      display: flex;
      flex-direction: column;
    }

    .pref-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
    }

    .pref-desc {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .pref-control {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .volume-slider {
      width: 140px;
    }

    .pref-val {
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      color: var(--text-secondary);
      min-width: 36px;
    }

    .select-box {
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      outline: none;
    }

    .btn-toggle {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .btn-toggle.active {
      background: var(--accent-muted);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .about-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .about-item {
      background: var(--bg-elevated);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
    }

    .about-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .about-value {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 2px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  private readonly settingsGateway = inject(SETTINGS_GATEWAY);
  readonly player = inject(PlayerService);

  readonly folders = signal<MusicFolder[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadFolders(),
      this.loadSettings(),
    ]);
  }

  async loadSettings(): Promise<void> {
    try {
      const s = await this.settingsGateway.getSettings();
      if (s) {
        if (typeof s.defaultVolume === 'number') {
          this.player.setVolume(s.defaultVolume);
        }
        if (s.repeatMode) {
          this.player.setRepeatMode(s.repeatMode);
        }
        if (typeof s.shuffle === 'boolean') {
          this.player.setShuffle(s.shuffle);
        }
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load settings');
    }
  }

  async loadFolders(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.folders.set(lib.folders);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load library folders');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onAddFolder(): Promise<void> {
    this.errorMessage.set(null);
    try {
      const selected = await this.libraryGateway.selectAndAddMusicFolders();
      if (selected && selected.length > 0) {
        await this.loadFolders();
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to select or add folder');
    }
  }

  async onRemoveFolder(folderId: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.libraryGateway.removeMusicFolder(folderId);
      await this.loadFolders();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to remove folder');
    }
  }

  async onRescanLibrary(): Promise<void> {
    try {
      await this.libraryGateway.requestScan();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to request scan');
    }
  }

  async onVolumeChange(val: number): Promise<void> {
    this.player.setVolume(val);
    try {
      await this.settingsGateway.saveSettings({ defaultVolume: val });
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to save volume preference');
    }
  }

  async onRepeatChange(mode: RepeatMode): Promise<void> {
    this.player.setRepeatMode(mode);
    try {
      await this.settingsGateway.saveSettings({ repeatMode: mode });
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to save repeat preference');
    }
  }
}
