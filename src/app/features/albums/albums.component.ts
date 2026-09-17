import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { Album, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';

@Component({
  selector: 'app-albums',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="albums-page">
      <header class="page-header">
        <div class="title-group">
          <h1>Albums</h1>
          <span class="count-badge">{{ filteredAlbums().length }} albums</span>
        </div>

        <div class="search-box">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search albums by title or artist..."
            aria-label="Search albums" />
          @if (searchQuery()) {
            <button type="button" class="clear-btn" (click)="searchQuery.set('')">&times;</button>
          }
        </div>
      </header>

      @if (errorMessage()) {
        <div class="error-state" role="alert">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p class="error-title">Failed to load albums</p>
          <p class="error-desc">{{ errorMessage() }}</p>
          <button type="button" class="btn-retry" (click)="loadAlbums()">Retry</button>
        </div>
      } @else if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading albums...</p>
        </div>
      } @else if (filteredAlbums().length === 0) {
        <div class="empty-state">
          <p>No albums found.</p>
        </div>
      } @else {
        <div class="albums-grid">
          @for (album of filteredAlbums(); track album.id) {
            <div class="album-card" [routerLink]="['/albums', album.id]" tabindex="0" role="button">
              <div class="cover-wrapper">
                @if (album.artwork) {
                  <img [src]="album.artwork" [alt]="album.title" class="cover-img" />
                } @else {
                  <div class="cover-placeholder" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                }
                <!-- Quick Play Overlay Button -->
                <button
                  type="button"
                  class="quick-play-btn"
                  (click)="onPlayAlbum($event, album)"
                  title="Play Album"
                  aria-label="Play Album">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <polygon points="6 4 20 12 6 20 6 4"></polygon>
                  </svg>
                </button>
              </div>

              <div class="album-meta">
                <h3 class="album-title truncate" [title]="album.title">{{ album.title }}</h3>
                <p class="album-artist truncate" [title]="album.artist || 'Unknown Artist'">
                  {{ album.artist || 'Unknown Artist' }}
                </p>
                <div class="album-sub">
                  <span>{{ album.year || 'Unknown Year' }}</span>
                  <span class="dot">•</span>
                  <span>{{ album.trackIds.length }} tracks</span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .albums-page {
      padding: var(--space-6);
      height: 100%;
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .title-group h1 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
    }

    .count-badge {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
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
    }

    .search-box input {
      width: 100%;
      height: 36px;
      padding-left: 36px;
      padding-right: 32px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      color: var(--text-primary);
    }

    .clear-btn {
      position: absolute;
      right: var(--space-2);
      font-size: 16px;
      color: var(--text-muted);
    }

    .albums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-5);
    }

    .album-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      cursor: pointer;
      transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    .album-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-4px);
      border-color: rgba(139, 92, 246, 0.4);
    }

    .cover-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-elevated);
      margin-bottom: var(--space-3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .quick-play-btn {
      position: absolute;
      bottom: var(--space-3);
      right: var(--space-3);
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px var(--accent-glow);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity var(--transition-fast), transform var(--transition-fast), background var(--transition-fast);
    }

    .album-card:hover .quick-play-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .quick-play-btn:hover {
      background: var(--accent-hover);
      transform: scale(1.08);
    }

    .album-meta {
      display: flex;
      flex-direction: column;
    }

    .album-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
    }

    .album-artist {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .album-sub {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: 11px;
      color: var(--text-muted);
      margin-top: var(--space-2);
    }

    .dot {
      font-size: 8px;
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
export class AlbumsComponent implements OnInit {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  private readonly player = inject(PlayerService);

  readonly albums = signal<Album[]>([]);
  readonly allTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  readonly filteredAlbums = computed<Album[]>(() => {
    const list = this.albums();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;

    return list.filter((a) => {
      const titleMatch = a.title.toLowerCase().includes(query);
      const artistMatch = (a.artist || '').toLowerCase().includes(query);
      return titleMatch || artistMatch;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadAlbums();
  }

  async loadAlbums(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.albums.set(lib.albums);
      this.allTracks.set(lib.tracks);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load albums');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPlayAlbum(event: MouseEvent, album: Album): void {
    event.stopPropagation();
    const trackMap = new Map<string, Track>();
    this.allTracks().forEach((t) => trackMap.set(t.id, t));

    const albumTracks: Track[] = [];
    album.trackIds.forEach((id) => {
      const t = trackMap.get(id);
      if (t) albumTracks.push(t);
    });

    if (albumTracks.length > 0) {
      this.player.playCollection(albumTracks, 0);
    }
  }
}
