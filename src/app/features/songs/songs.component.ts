import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

type SortColumn = 'title' | 'artist' | 'album' | 'duration' | 'codec' | 'sampleRate';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-songs',
  standalone: true,
  imports: [CommonModule, FormsModule, DurationPipe],
  template: `
    <div class="songs-container">
      <!-- Header & Search Toolbar -->
      <header class="songs-header">
        <div class="title-area">
          <h1>Songs</h1>
          <span class="track-count">{{ filteredTracks().length }} tracks</span>
        </div>

        <div class="toolbar">
          <!-- Quick Action Buttons -->
          <button
            type="button"
            class="action-btn primary"
            (click)="onPlayAll()"
            [disabled]="filteredTracks().length === 0"
            title="Play all tracks in current view">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play All
          </button>

          <button
            type="button"
            class="action-btn secondary"
            (click)="onShuffleAll()"
            [disabled]="filteredTracks().length === 0"
            title="Shuffle all tracks in current view">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            Shuffle
          </button>

          <!-- Search Box -->
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by title, artist, album..."
              aria-label="Search tracks" />
            @if (searchQuery()) {
              <button type="button" class="clear-search-btn" (click)="searchQuery.set('')" title="Clear search">
                &times;
              </button>
            }
          </div>
        </div>
      </header>

      <!-- Unavailable Track Notice Toast -->
      @if (noticeMessage()) {
        <div class="notice-toast" role="alert">
          <span>{{ noticeMessage() }}</span>
          <button type="button" (click)="noticeMessage.set(null)" aria-label="Dismiss notice">&times;</button>
        </div>
      }

      <!-- Main Songs Table View -->
      <div class="table-scroll-container">
        @if (errorMessage()) {
          <div class="error-state" role="alert">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p class="error-title">Failed to load songs</p>
            <p class="error-desc">{{ errorMessage() }}</p>
            <button type="button" class="btn-retry" (click)="loadSongs()">Retry</button>
          </div>
        } @else if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading your music library...</p>
          </div>
        } @else if (filteredTracks().length === 0) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p class="empty-title">No songs found</p>
            <p class="empty-desc">
              @if (searchQuery()) {
                No tracks match your search "{{ searchQuery() }}". Try a different keyword.
              } @else {
                Your music library is currently empty.
              }
            </p>
          </div>
        } @else {
          <table class="songs-table" role="grid" aria-label="Songs list">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th class="col-title sortable" (click)="toggleSort('title')" [attr.aria-sort]="getAriaSort('title')">
                  <span>Title</span>
                  @if (sortColumn() === 'title') {
                    <span class="sort-indicator">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="col-artist sortable" (click)="toggleSort('artist')" [attr.aria-sort]="getAriaSort('artist')">
                  <span>Artist</span>
                  @if (sortColumn() === 'artist') {
                    <span class="sort-indicator">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="col-album sortable" (click)="toggleSort('album')" [attr.aria-sort]="getAriaSort('album')">
                  <span>Album</span>
                  @if (sortColumn() === 'album') {
                    <span class="sort-indicator">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="col-duration sortable" (click)="toggleSort('duration')" [attr.aria-sort]="getAriaSort('duration')">
                  <span>Time</span>
                  @if (sortColumn() === 'duration') {
                    <span class="sort-indicator">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="col-codec sortable" (click)="toggleSort('codec')" [attr.aria-sort]="getAriaSort('codec')">
                  <span>Codec</span>
                  @if (sortColumn() === 'codec') {
                    <span class="sort-indicator">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="col-quality sortable" (click)="toggleSort('sampleRate')" [attr.aria-sort]="getAriaSort('sampleRate')">
                  <span>Sample Rate</span>
                  @if (sortColumn() === 'sampleRate') {
                    <span class="sort-indicator">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                  }
                </th>
                <th class="col-actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (track of filteredTracks(); track track.id; let i = $index) {
                <tr
                  class="song-row"
                  [class.selected]="selectedTrackId() === track.id"
                  [class.playing]="player.currentTrack()?.id === track.id"
                  [class.unavailable]="!track.isAvailable"
                  (click)="onSelectTrack(track)"
                  (dblclick)="onPlayTrack(track, i)"
                  (keydown.enter)="onPlayTrack(track, i)"
                  tabindex="0"
                  role="row">
                  <!-- # Index / Playing Indicator -->
                  <td class="col-index">
                    @if (player.currentTrack()?.id === track.id) {
                      <div class="playing-indicator" title="Currently Playing">
                        @if (player.isPlaying()) {
                          <span class="bar bar-1"></span>
                          <span class="bar bar-2"></span>
                          <span class="bar bar-3"></span>
                        } @else {
                          <span class="pause-dot">❚❚</span>
                        }
                      </div>
                    } @else {
                      <span class="row-num">{{ i + 1 }}</span>
                    }
                  </td>

                  <!-- Title with Artwork -->
                  <td class="col-title">
                    <div class="title-cell">
                      @if (track.artwork) {
                        <img [src]="track.artwork" [alt]="track.title" class="thumb-img" />
                      } @else {
                        <div class="thumb-placeholder" aria-hidden="true">♪</div>
                      }
                      <div class="title-text-group">
                        <span class="track-name truncate" [title]="track.title">
                          {{ track.title }}
                        </span>
                        @if (!track.isAvailable) {
                          <span class="badge-unavailable" title="File not found or missing from disk">
                            Unavailable
                          </span>
                        }
                      </div>
                    </div>
                  </td>

                  <!-- Artist -->
                  <td class="col-artist truncate" [title]="track.artist || 'Unknown Artist'">
                    {{ track.artist || 'Unknown Artist' }}
                  </td>

                  <!-- Album -->
                  <td class="col-album truncate" [title]="track.album || 'Unknown Album'">
                    {{ track.album || 'Unknown Album' }}
                  </td>

                  <!-- Duration -->
                  <td class="col-duration">
                    {{ track.duration | duration }}
                  </td>

                  <!-- Codec Badge -->
                  <td class="col-codec">
                    <span class="badge-codec" [class.hi-res]="isHiRes(track)">
                      {{ track.codec || 'UNKNOWN' }}
                    </span>
                  </td>

                  <!-- Sample Rate & Bit Depth -->
                  <td class="col-quality">
                    <span class="quality-spec">
                      {{ formatSampleRate(track.sampleRate) }}
                      @if (track.bitDepth) {
                        <span class="bit-depth">/ {{ track.bitDepth }}-bit</span>
                      }
                    </span>
                  </td>

                  <!-- Row Actions -->
                  <td class="col-actions" (click)="$event.stopPropagation()">
                    <div class="row-actions">
                      <button
                        type="button"
                        class="row-action-btn"
                        (click)="onPlayNext(track)"
                        title="Play Next">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                          <polygon points="5 4 15 12 5 20 5 4"></polygon>
                          <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="row-action-btn"
                        (click)="onAddToQueue(track)"
                        title="Add to Queue">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .songs-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: var(--space-6);
      background: var(--bg-app);
    }

    .songs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .title-area h1 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .track-count {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-top: 2px;
      display: block;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .action-btn {
      height: 36px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      transition: background var(--transition-fast), transform var(--transition-fast);
    }

    .action-btn.primary {
      background: var(--accent-primary);
      color: #ffffff;
    }

    .action-btn.primary:hover:not(:disabled) {
      background: var(--accent-hover);
    }

    .action-btn.secondary {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
    }

    .action-btn.secondary:hover:not(:disabled) {
      background: var(--bg-surface-hover);
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 280px;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      height: 36px;
      padding-left: 36px;
      padding-right: 32px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
    }

    .clear-search-btn {
      position: absolute;
      right: var(--space-2);
      width: 24px;
      height: 24px;
      font-size: 16px;
      color: var(--text-muted);
    }

    .notice-toast {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid var(--status-error);
      color: #fca5a5;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .table-scroll-container {
      flex: 1;
      overflow-y: auto;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      background: var(--bg-surface);
    }

    .songs-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);
    }

    .songs-table thead {
      position: sticky;
      top: 0;
      background: var(--bg-elevated);
      z-index: 2;
      border-bottom: 1px solid var(--border-default);
    }

    .songs-table th {
      padding: var(--space-3) var(--space-4);
      color: var(--text-muted);
      font-weight: 600;
      font-size: var(--font-size-xs);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      user-select: none;
    }

    .songs-table th.sortable {
      cursor: pointer;
    }

    .songs-table th.sortable:hover {
      color: var(--text-primary);
    }

    .sort-indicator {
      margin-left: var(--space-1);
      color: var(--accent-primary);
    }

    .song-row {
      height: 48px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .song-row:hover {
      background: var(--bg-surface-hover);
    }

    .song-row.selected {
      background: var(--bg-surface-active);
    }

    .song-row.playing {
      color: var(--accent-primary);
    }

    .song-row.playing .track-name {
      color: var(--accent-primary);
      font-weight: 600;
    }

    .song-row.unavailable {
      opacity: 0.45;
    }

    .songs-table td {
      padding: var(--space-2) var(--space-4);
      vertical-align: middle;
    }

    .col-index { width: 48px; text-align: center; }
    .col-title { min-width: 240px; }
    .col-artist { width: 180px; }
    .col-album { width: 200px; }
    .col-duration { width: 80px; font-family: var(--font-family-mono); }
    .col-codec { width: 100px; }
    .col-quality { width: 140px; font-family: var(--font-family-mono); }
    .col-actions { width: 80px; text-align: right; }

    .title-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .thumb-img, .thumb-placeholder {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      object-fit: cover;
    }

    .thumb-placeholder {
      background: var(--bg-elevated);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .title-text-group {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }

    .track-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .badge-unavailable {
      font-size: 10px;
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      font-weight: 600;
    }

    .badge-codec {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-weight: 700;
      font-family: var(--font-family-mono);
      letter-spacing: 0.05em;
    }

    .badge-codec.hi-res {
      background: rgba(139, 92, 246, 0.18);
      color: var(--accent-primary);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    .quality-spec {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }

    .bit-depth {
      color: var(--text-muted);
    }

    .row-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-1);
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .song-row:hover .row-actions {
      opacity: 1;
    }

    .row-action-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .row-action-btn:hover {
      color: var(--text-primary);
      background: var(--bg-surface-active);
    }

    /* Animated playing bars */
    .playing-indicator {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 14px;
    }

    .bar {
      width: 3px;
      background: var(--accent-primary);
      border-radius: 1px;
      animation: equalize 1s infinite alternate ease-in-out;
    }

    .bar-1 { height: 6px; animation-delay: 0.1s; }
    .bar-2 { height: 14px; animation-delay: 0.3s; }
    .bar-3 { height: 9px; animation-delay: 0.2s; }

    @keyframes equalize {
      0% { height: 3px; }
      100% { height: 14px; }
    }

    .pause-dot {
      font-size: 10px;
      color: var(--accent-primary);
    }

    .loading-state, .empty-state, .error-state {
      padding: var(--space-10);
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .error-state svg {
      stroke: var(--status-error);
    }

    .error-title {
      font-weight: 700;
      font-size: var(--font-size-md);
      color: var(--text-primary);
    }

    .error-desc {
      font-size: var(--font-size-sm);
      color: var(--status-error);
      max-width: 420px;
    }

    .btn-retry {
      padding: var(--space-2) var(--space-5);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      font-weight: 500;
      cursor: pointer;
      transition: background var(--transition-fast), border-color var(--transition-fast);
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
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-title {
      font-weight: 700;
      font-size: var(--font-size-md);
      color: var(--text-primary);
    }
  `]
})
export class SongsComponent implements OnInit {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);

  readonly tracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly searchQuery = signal<string>('');
  readonly sortColumn = signal<SortColumn>('title');
  readonly sortDirection = signal<SortDirection>('asc');
  readonly selectedTrackId = signal<string | null>(null);
  readonly noticeMessage = signal<string | null>(null);

  readonly filteredTracks = computed<Track[]>(() => {
    const list = this.tracks();
    const query = this.searchQuery().trim().toLowerCase();

    // 1. Search Filter
    let result = list;
    if (query) {
      result = result.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(query);
        const artistMatch = (t.artist || '').toLowerCase().includes(query);
        const albumMatch = (t.album || '').toLowerCase().includes(query);
        return titleMatch || artistMatch || albumMatch;
      });
    }

    // 2. Sort
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return [...result].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (col) {
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case 'artist':
          valA = (a.artist || '').toLowerCase();
          valB = (b.artist || '').toLowerCase();
          break;
        case 'album':
          valA = (a.album || '').toLowerCase();
          valB = (b.album || '').toLowerCase();
          break;
        case 'duration':
          valA = a.duration;
          valB = b.duration;
          break;
        case 'codec':
          valA = (a.codec || '').toLowerCase();
          valB = (b.codec || '').toLowerCase();
          break;
        case 'sampleRate':
          valA = a.sampleRate || 0;
          valB = b.sampleRate || 0;
          break;
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  });

  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadSongs();
  }

  async loadSongs(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.tracks.set(lib.tracks);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load songs from library');
    } finally {
      this.isLoading.set(false);
    }
  }

  onSelectTrack(track: Track): void {
    this.selectedTrackId.set(track.id);
  }

  onPlayTrack(track: Track, indexInFiltered: number): void {
    if (!track.isAvailable) {
      this.noticeMessage.set(`Track "${track.title}" is unavailable or missing from disk.`);
      return;
    }
    this.noticeMessage.set(null);
    this.selectedTrackId.set(track.id);
    this.player.playCollection(this.filteredTracks(), indexInFiltered);
  }

  onPlayAll(): void {
    const list = this.filteredTracks();
    if (list.length > 0) {
      this.player.playCollection(list, 0);
    }
  }

  onShuffleAll(): void {
    const list = this.filteredTracks();
    if (list.length > 0) {
      if (!this.player.isShuffle()) {
        this.player.toggleShuffle();
      }
      this.player.playCollection(list, 0);
    }
  }

  onPlayNext(track: Track): void {
    this.player.playNext([track]);
  }

  onAddToQueue(track: Track): void {
    this.player.addToQueue([track]);
  }

  toggleSort(col: SortColumn): void {
    if (this.sortColumn() === col) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('asc');
    }
  }

  getAriaSort(col: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== col) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  isHiRes(track: Track): boolean {
    return (track.sampleRate !== null && track.sampleRate > 48000) ||
           (track.bitDepth !== null && track.bitDepth > 16);
  }

  formatSampleRate(sr: number | null): string {
    if (!sr) return '—';
    const khz = sr / 1000;
    return Number.isInteger(khz) ? `${khz} kHz` : `${khz.toFixed(1)} kHz`;
  }
}
