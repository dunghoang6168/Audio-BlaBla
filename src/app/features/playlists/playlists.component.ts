import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY, PLAYLIST_GATEWAY } from '../../core/contracts';
import { Playlist, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="playlists-page">
      <header class="page-header">
        <div class="title-group">
          <h1>Playlists</h1>
          <span class="count-badge">{{ playlists().length }} playlists</span>
        </div>

        <button type="button" class="btn-create" (click)="showCreateModal.set(true)">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Playlist
        </button>
      </header>

      @if (errorMessage()) {
        <div class="error-state" role="alert">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p class="error-title">Failed to load playlists</p>
          <p class="error-desc">{{ errorMessage() }}</p>
          <button type="button" class="btn-retry" (click)="loadData()">Retry</button>
        </div>
      } @else if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading playlists...</p>
        </div>
      } @else if (playlists().length === 0) {
        <div class="empty-state">
          <p class="empty-title">No playlists yet</p>
          <p class="empty-desc">Create your first playlist to organize your favorite music.</p>
          <button type="button" class="btn-create" (click)="showCreateModal.set(true)">Create Playlist</button>
        </div>
      } @else {
        <div class="playlists-grid">
          @for (playlist of playlists(); track playlist.id) {
            <div class="playlist-card" [routerLink]="['/playlists', playlist.id]" tabindex="0" role="button">
              <div class="playlist-icon-box">
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" fill="none" stroke-width="1.8">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>

                <button
                  type="button"
                  class="quick-play-btn"
                  (click)="onPlayPlaylist($event, playlist)"
                  [disabled]="playlist.entries.length === 0"
                  title="Play Playlist">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <polygon points="6 4 20 12 6 20 6 4"></polygon>
                  </svg>
                </button>
              </div>

              <div class="playlist-info">
                <h3 class="playlist-name truncate" [title]="playlist.name">{{ playlist.name }}</h3>
                <span class="playlist-stats">{{ playlist.entries.length }} tracks</span>
              </div>

              <div class="card-actions" (click)="$event.stopPropagation()">
                <button
                  type="button"
                  class="btn-icon"
                  (click)="onOpenRename($event, playlist)"
                  title="Rename Playlist">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icon delete"
                  (click)="onOpenDelete($event, playlist)"
                  title="Delete Playlist">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create Playlist Modal -->
      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="showCreateModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>Create Playlist</h3>
            <p class="modal-desc">Give your new playlist a descriptive name:</p>
            <input
              type="text"
              class="modal-input"
              [(ngModel)]="newPlaylistName"
              placeholder="e.g. Acoustic Chill, Workout"
              (keydown.enter)="onConfirmCreate()"
              autofocus />
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="showCreateModal.set(false)">Cancel</button>
              <button type="button" class="btn-confirm" (click)="onConfirmCreate()">Create</button>
            </div>
          </div>
        </div>
      }

      <!-- Rename Modal -->
      @if (playlistToRename()) {
        <div class="modal-backdrop" (click)="playlistToRename.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>Rename Playlist</h3>
            <input
              type="text"
              class="modal-input"
              [(ngModel)]="renameValue"
              (keydown.enter)="onConfirmRename()"
              autofocus />
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="playlistToRename.set(null)">Cancel</button>
              <button type="button" class="btn-confirm" (click)="onConfirmRename()">Save</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (playlistToDelete()) {
        <div class="modal-backdrop" (click)="playlistToDelete.set(null)">
          <div class="modal-card danger" (click)="$event.stopPropagation()">
            <h3>Delete Playlist</h3>
            <p class="modal-desc">
              Are you sure you want to delete <strong>{{ playlistToDelete()?.name }}</strong>?
            </p>
            <div class="safe-note">
              ✓ <strong>Safe:</strong> This will delete the playlist. Your music library files will not be touched.
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="playlistToDelete.set(null)">Cancel</button>
              <button type="button" class="btn-danger" (click)="onConfirmDelete()">Delete Playlist</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .playlists-page {
      padding: var(--space-6);
      height: 100%;
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }

    .title-group h1 { font-size: var(--font-size-2xl); font-weight: 700; }
    .count-badge { font-size: var(--font-size-xs); color: var(--text-muted); }

    .btn-create {
      height: 36px;
      padding: 0 var(--space-4);
      background: var(--accent-primary);
      color: #ffffff;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: var(--font-size-sm);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      transition: background var(--transition-fast);
    }

    .btn-create:hover { background: var(--accent-hover); }

    .playlists-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-4);
    }

    .playlist-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
      user-select: none;
    }

    .playlist-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-3px);
      border-color: rgba(139, 92, 246, 0.4);
    }

    .playlist-icon-box {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #1e1b4b, #31102f);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
      margin-bottom: var(--space-3);
      position: relative;
    }

    .quick-play-btn {
      position: absolute;
      bottom: var(--space-2);
      right: var(--space-2);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px var(--accent-glow);
      opacity: 0;
      transform: translateY(4px);
      transition: opacity var(--transition-fast), transform var(--transition-fast);
    }

    .playlist-card:hover .quick-play-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .playlist-name {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
    }

    .playlist-stats {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-top: 2px;
      display: block;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-top: var(--space-3);
      justify-content: flex-end;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .btn-icon:hover {
      color: var(--text-primary);
      background: var(--bg-surface-active);
    }

    .btn-icon.delete:hover {
      color: var(--status-error);
    }

    /* Modals */
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
      max-width: 420px;
      box-shadow: var(--shadow-lg);
    }

    .modal-card h3 { font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-2); }
    .modal-desc { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-4); }

    .modal-input {
      width: 100%;
      height: 38px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 0 var(--space-3);
      color: var(--text-primary);
      margin-bottom: var(--space-6);
    }

    .safe-note {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--status-success);
      color: #6ee7b7;
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

    .btn-confirm {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 600;
    }

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

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PlaylistsComponent implements OnInit {
  private readonly playlistGateway = inject(PLAYLIST_GATEWAY);
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);

  readonly playlists = signal<Playlist[]>([]);
  readonly allTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Modals state
  readonly showCreateModal = signal<boolean>(false);
  newPlaylistName = '';

  readonly playlistToRename = signal<Playlist | null>(null);
  renameValue = '';

  readonly playlistToDelete = signal<Playlist | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [plist, lib] = await Promise.all([
        this.playlistGateway.getPlaylists(),
        this.libraryGateway.getLibrary(),
      ]);
      this.playlists.set(plist);
      this.allTracks.set(lib.tracks);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load playlists');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onConfirmCreate(): Promise<void> {
    const name = this.newPlaylistName.trim();
    if (!name) return;
    this.errorMessage.set(null);
    try {
      await this.playlistGateway.createPlaylist(name);
      this.newPlaylistName = '';
      this.showCreateModal.set(false);
      await this.loadData();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to create playlist');
    }
  }

  onOpenRename(event: MouseEvent, playlist: Playlist): void {
    event.stopPropagation();
    this.playlistToRename.set(playlist);
    this.renameValue = playlist.name;
  }

  async onConfirmRename(): Promise<void> {
    const pl = this.playlistToRename();
    if (!pl || !this.renameValue.trim()) return;
    this.errorMessage.set(null);
    try {
      await this.playlistGateway.renamePlaylist(pl.id, this.renameValue.trim());
      this.playlistToRename.set(null);
      await this.loadData();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to rename playlist');
    }
  }

  onOpenDelete(event: MouseEvent, playlist: Playlist): void {
    event.stopPropagation();
    this.playlistToDelete.set(playlist);
  }

  async onConfirmDelete(): Promise<void> {
    const pl = this.playlistToDelete();
    if (!pl) return;
    this.errorMessage.set(null);
    try {
      await this.playlistGateway.deletePlaylist(pl.id);
      this.playlistToDelete.set(null);
      await this.loadData();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to delete playlist');
    }
  }

  onPlayPlaylist(event: MouseEvent, playlist: Playlist): void {
    event.stopPropagation();
    const trackMap = new Map<string, Track>();
    this.allTracks().forEach((t) => trackMap.set(t.id, t));

    const tracks: Track[] = [];
    playlist.entries.forEach((entry) => {
      const t = trackMap.get(entry.trackId);
      if (t) tracks.push(t);
    });

    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }
}
