import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY, PLAYLIST_GATEWAY } from '../../../core/contracts';
import { Playlist, PlaylistEntry, Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface PlaylistTrackRow {
  entry: PlaylistEntry;
  track: Track;
}

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DurationPipe, IconComponent],
  template: `
    <div class="playlist-detail-page">
      <nav class="breadcrumb">
        <a routerLink="/playlists" class="back-link">
          <app-icon name="chevron-left" [size]="16" />
          Back to Playlists
        </a>
      </nav>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading playlist...</p>
        </div>
      } @else if (!playlist()) {
        <div class="empty-state">
          <h2>Playlist Not Found</h2>
          <p>This playlist does not exist or has been deleted.</p>
          <a routerLink="/playlists" class="btn-back">Browse Playlists</a>
        </div>
      } @else {
        <!-- Playlist Hero -->
        <header class="playlist-hero">
          <div class="hero-icon-box">
            <app-icon name="list-music" [size]="64" />
          </div>

          <div class="hero-info">
            <span class="type-tag">PLAYLIST</span>
            <h1 class="playlist-name">{{ playlist()?.name }}</h1>
            <p class="playlist-stats">
              {{ trackRows().length }} tracks &bull; {{ totalDuration() }}
            </p>

            <div class="hero-actions">
              <button
                type="button"
                class="btn-play"
                (click)="onPlayAll()"
                [disabled]="trackRows().length === 0"
                aria-label="Play Playlist">
                <app-icon name="play" [size]="18" />
                Play Playlist
              </button>

              <button
                type="button"
                class="btn-action"
                (click)="onShufflePlay()"
                [disabled]="trackRows().length === 0"
                aria-label="Shuffle Playlist">
                <app-icon name="shuffle" [size]="16" />
                Shuffle
              </button>

              <button
                type="button"
                class="btn-action"
                (click)="showAddTracksModal.set(true)"
                aria-label="Add Tracks">
                <app-icon name="plus" [size]="16" />
                Add Tracks
              </button>
            </div>
          </div>
        </header>

        <!-- Track Entries Table -->
        <div class="table-card">
          @if (trackRows().length === 0) {
            <div class="empty-playlist">
              <p>This playlist has no tracks yet.</p>
              <button type="button" class="btn-action primary" (click)="showAddTracksModal.set(true)">
                Add Songs Now
              </button>
            </div>
          } @else {
            <table class="playlist-table">
              <thead>
                <tr>
                  <th class="col-reorder"><span class="sr-only">Order</span></th>
                  <th class="col-num">#</th>
                  <th class="col-title">Title</th>
                  <th class="col-artist">Artist</th>
                  <th class="col-duration">Time</th>
                  <th class="col-actions"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of trackRows(); track row.entry.id; let i = $index) {
                  <tr
                    class="entry-row"
                    [class.playing]="player.currentTrack()?.id === row.track.id"
                    [class.unavailable]="!row.track.isAvailable"
                    (dblclick)="onPlayRow(i)"
                    tabindex="0"
                    (keydown.enter)="onPlayRow(i)">
                    <!-- Move Up / Down Buttons -->
                    <td class="col-reorder" (click)="$event.stopPropagation()">
                      <div class="reorder-btns">
                        <button
                          type="button"
                          class="reorder-btn"
                          [disabled]="i === 0"
                          (click)="onMoveUp(i)"
                          title="Move Up"
                          aria-label="Move track up">
                          <app-icon name="arrow-up" [size]="12" />
                        </button>
                        <button
                          type="button"
                          class="reorder-btn"
                          [disabled]="i === trackRows().length - 1"
                          (click)="onMoveDown(i)"
                          title="Move Down"
                          aria-label="Move track down">
                          <app-icon name="arrow-down" [size]="12" />
                        </button>
                      </div>
                    </td>

                    <!-- Index -->
                    <td class="col-num">
                      @if (player.currentTrack()?.id === row.track.id) {
                        <span class="playing-icon">
                          <app-icon name="play" [size]="12" />
                        </span>
                      } @else {
                        {{ i + 1 }}
                      }
                    </td>

                    <!-- Title with Artwork -->
                    <td class="col-title">
                      <div class="title-cell">
                        @if (row.track.artwork) {
                          <img [src]="row.track.artwork" [alt]="row.track.title" class="thumb-img" />
                        } @else {
                          <div class="thumb-placeholder">
                            <app-icon name="music" [size]="16" />
                          </div>
                        }
                        <span class="track-title truncate" [title]="row.track.title">
                          {{ row.track.title }}
                        </span>
                        @if (!row.track.isAvailable) {
                          <span class="badge-unavailable">Unavailable</span>
                        }
                      </div>
                    </td>

                    <!-- Artist -->
                    <td class="col-artist truncate" [title]="row.track.artist || 'Unknown Artist'">
                      {{ row.track.artist || 'Unknown Artist' }}
                    </td>

                    <!-- Duration -->
                    <td class="col-duration">
                      {{ row.track.duration | duration }}
                    </td>

                    <!-- Remove from Playlist Action -->
                    <td class="col-actions" (click)="$event.stopPropagation()">
                      <button
                        type="button"
                        class="btn-remove-entry"
                        (click)="onRemoveEntry(row.entry.id)"
                        title="Remove from playlist"
                        aria-label="Remove from playlist">
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Add Tracks Modal Dialog -->
      @if (showAddTracksModal()) {
        <div class="modal-backdrop" (click)="showAddTracksModal.set(false)">
          <div class="modal-card wide" (click)="$event.stopPropagation()" role="dialog" aria-labelledby="addTracksTitle">
            <h3 id="addTracksTitle">Add Songs to Playlist</h3>
            <p class="modal-desc">Click any song from your library to add it:</p>

            <div class="tracks-picker-list">
              @for (t of allLibraryTracks(); track t.id) {
                <div class="picker-row" (click)="onAddSingleTrack(t.id)">
                  <div class="picker-info">
                    <span class="picker-title truncate">{{ t.title }}</span>
                    <span class="picker-artist truncate">{{ t.artist || 'Unknown Artist' }}</span>
                  </div>
                  <button type="button" class="btn-picker-add">Add +</button>
                </div>
              }
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-confirm" (click)="showAddTracksModal.set(false)">Done</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .playlist-detail-page {
      padding: var(--space-6);
      height: 100%;
      overflow-y: auto;
    }

    .breadcrumb { margin-bottom: var(--space-4); }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--font-size-sm);
    }

    .back-link:hover { color: var(--accent-primary); }

    .playlist-hero {
      display: flex;
      align-items: flex-end;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
      flex-wrap: wrap;
    }

    .hero-icon-box {
      width: 180px;
      height: 180px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, #1e1b4b, #31102f);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-default);
      flex-shrink: 0;
    }

    .hero-info {
      flex: 1;
      min-width: 260px;
      display: flex;
      flex-direction: column;
    }

    .type-tag {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent-primary);
      letter-spacing: 0.08em;
      margin-bottom: var(--space-1);
    }

    .playlist-name {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      margin-bottom: var(--space-2);
    }

    .playlist-stats {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .btn-play {
      height: 40px;
      padding: 0 var(--space-6);
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 600;
      font-size: var(--font-size-sm);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      box-shadow: 0 2px 10px var(--accent-glow);
    }

    .btn-play:hover:not(:disabled) { background: var(--accent-hover); }

    .btn-action {
      height: 40px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      font-weight: 600;
      font-size: var(--font-size-sm);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-action:hover:not(:disabled) { background: var(--bg-surface-hover); }

    .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .playlist-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    .playlist-table th {
      padding: var(--space-3) var(--space-4);
      color: var(--text-muted);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
    }

    .entry-row {
      height: 48px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .entry-row:hover { background: var(--bg-surface-hover); }
    .entry-row.playing { color: var(--accent-primary); }
    .entry-row.playing .track-title { color: var(--accent-primary); font-weight: 600; }
    .entry-row.unavailable { opacity: 0.45; }

    .playlist-table td {
      padding: var(--space-2) var(--space-4);
      vertical-align: middle;
    }

    .col-reorder { width: 36px; padding-right: 0 !important; }
    .col-num { width: 40px; text-align: center; color: var(--text-muted); }
    .col-title { min-width: 250px; }
    .col-artist { width: 200px; color: var(--text-secondary); }
    .col-duration { width: 80px; font-family: var(--font-family-mono); color: var(--text-muted); }
    .col-actions { width: 50px; text-align: right; }

    .reorder-btns {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .reorder-btn {
      font-size: 8px;
      color: var(--text-muted);
      padding: 0;
      line-height: 1;
    }

    .reorder-btn:hover:not(:disabled) { color: var(--text-primary); }

    .title-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .thumb-img, .thumb-placeholder {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      flex-shrink: 0;
    }

    .thumb-placeholder {
      background: var(--bg-elevated);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .badge-unavailable {
      font-size: 10px;
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
    }

    .playing-icon { color: var(--accent-primary); font-size: 11px; }

    .btn-remove-entry {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
    }

    .btn-remove-entry:hover {
      color: var(--status-error);
      background: rgba(239, 68, 68, 0.15);
    }

    .empty-playlist {
      padding: var(--space-8);
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    /* Modal */
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

    .modal-card.wide {
      max-width: 520px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      width: 100%;
    }

    .tracks-picker-list {
      max-height: 320px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin: var(--space-4) 0;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: var(--space-2);
    }

    .picker-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      cursor: pointer;
    }

    .picker-row:hover { background: var(--bg-surface-hover); }

    .picker-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .picker-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .picker-artist {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .btn-picker-add {
      font-size: 11px;
      font-weight: 600;
      color: var(--accent-primary);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--accent-muted);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-confirm {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 600;
    }

    .loading-state, .empty-state {
      padding: var(--space-10);
      text-align: center;
      color: var(--text-muted);
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
export class PlaylistDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly playlistGateway = inject(PLAYLIST_GATEWAY);
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);

  readonly playlist = signal<Playlist | null>(null);
  readonly allLibraryTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly showAddTracksModal = signal<boolean>(false);

  readonly trackRows = computed<PlaylistTrackRow[]>(() => {
    const pl = this.playlist();
    if (!pl) return [];

    const trackMap = new Map<string, Track>();
    this.allLibraryTracks().forEach((t) => trackMap.set(t.id, t));

    const rows: PlaylistTrackRow[] = [];
    pl.entries.forEach((entry) => {
      const track = trackMap.get(entry.trackId);
      if (track) {
        rows.push({ entry, track });
      }
    });

    return rows;
  });

  readonly totalDuration = computed<string>(() => {
    const totalSecs = this.trackRows().reduce((acc, r) => acc + r.track.duration, 0);
    const mins = Math.floor(totalSecs / 60);
    return `${mins} min`;
  });

  async ngOnInit(): Promise<void> {
    await this.loadPlaylist();
  }

  async loadPlaylist(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    try {
      const [playlists, lib] = await Promise.all([
        this.playlistGateway.getPlaylists(),
        this.libraryGateway.getLibrary(),
      ]);
      const found = playlists.find((p) => p.id === id) || null;
      this.playlist.set(found);
      this.allLibraryTracks.set(lib.tracks);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onMoveUp(index: number): Promise<void> {
    const pl = this.playlist();
    if (!pl || index <= 0) return;

    const entries = [...pl.entries];
    const temp = entries[index - 1];
    entries[index - 1] = entries[index];
    entries[index] = temp;

    const entryIds = entries.map((e) => e.id);
    const updated = await this.playlistGateway.reorderEntries(pl.id, entryIds);
    this.playlist.set(updated);
  }

  async onMoveDown(index: number): Promise<void> {
    const pl = this.playlist();
    if (!pl || index >= pl.entries.length - 1) return;

    const entries = [...pl.entries];
    const temp = entries[index + 1];
    entries[index + 1] = entries[index];
    entries[index] = temp;

    const entryIds = entries.map((e) => e.id);
    const updated = await this.playlistGateway.reorderEntries(pl.id, entryIds);
    this.playlist.set(updated);
  }

  async onRemoveEntry(entryId: string): Promise<void> {
    const pl = this.playlist();
    if (!pl) return;
    const updated = await this.playlistGateway.removeEntry(pl.id, entryId);
    this.playlist.set(updated);
  }

  async onAddSingleTrack(trackId: string): Promise<void> {
    const pl = this.playlist();
    if (!pl) return;
    const updated = await this.playlistGateway.addTracks(pl.id, [trackId]);
    this.playlist.set(updated);
  }

  onPlayAll(): void {
    const tracks = this.trackRows().map((r) => r.track);
    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }

  onShufflePlay(): void {
    const tracks = this.trackRows().map((r) => r.track);
    if (tracks.length > 0) {
      if (!this.player.isShuffle()) {
        this.player.toggleShuffle();
      }
      this.player.playCollection(tracks, 0);
    }
  }

  onPlayRow(index: number): void {
    const tracks = this.trackRows().map((r) => r.track);
    if (index >= 0 && index < tracks.length) {
      if (!tracks[index].isAvailable) return;
      this.player.playCollection(tracks, index);
    }
  }
}
