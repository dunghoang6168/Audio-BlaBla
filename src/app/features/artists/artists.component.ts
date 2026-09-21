import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { Artist, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  template: `
    <div class="artists-page">
      <header class="page-header">
        <div class="title-group">
          <h1>Artists</h1>
          <span class="count-badge">{{ filteredArtists().length }} artists</span>
        </div>

        <div class="search-box">
          <app-icon name="search" [size]="16" class="search-icon" />
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search artists..."
            aria-label="Search artists" />
          @if (searchQuery()) {
            <button type="button" class="clear-btn" (click)="searchQuery.set('')" title="Clear search" aria-label="Clear search">
              <app-icon name="x" [size]="14" />
            </button>
          }
        </div>
      </header>

      @if (errorMessage()) {
        <div class="error-state" role="alert">
          <app-icon name="alert-triangle" [size]="48" />
          <p class="error-title">Failed to load artists</p>
          <p class="error-desc">{{ errorMessage() }}</p>
          <button type="button" class="btn-retry" (click)="loadArtists()">Retry</button>
        </div>
      } @else if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading artists...</p>
        </div>
      } @else if (filteredArtists().length === 0) {
        <div class="empty-state">
          <app-icon name="user" [size]="48" class="empty-icon" />
          <p class="empty-title">No artists found</p>
          <p class="empty-desc">No artists match your search or your library is empty.</p>
        </div>
      } @else {
        <div class="artists-grid">
          @for (artist of filteredArtists(); track artist.id) {
            <div class="artist-card" [routerLink]="['/artists', artist.id]" tabindex="0" role="button">
              <div class="avatar-wrapper">
                <div class="avatar-circle">
                  <span class="initial">{{ artist.name.charAt(0) }}</span>
                </div>
                <button
                  type="button"
                  class="quick-play-btn"
                  (click)="onPlayArtist($event, artist)"
                  title="Play artist tracks"
                  aria-label="Play artist tracks">
                  <app-icon name="play" [size]="20" />
                </button>
              </div>

              <div class="artist-meta">
                <h3 class="artist-name truncate" [title]="artist.name">{{ artist.name }}</h3>
                <span class="artist-stats">
                  {{ artist.albumIds.length }} {{ artist.albumIds.length === 1 ? 'album' : 'albums' }} •
                  {{ artist.trackIds.length }} tracks
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .artists-page {
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

    .artists-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-5);
    }

    .artist-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-5) var(--space-3);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
      user-select: none;
    }

    .artist-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-4px);
      border-color: var(--color-accent-glow);
    }

    .avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      margin-bottom: var(--space-4);
    }

    .avatar-circle {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #3b0764, #1e1b4b);
      border: 2px solid var(--border-default);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .initial {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      color: var(--accent-primary);
    }

    .quick-play-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px var(--accent-glow);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity var(--transition-fast), transform var(--transition-fast), background var(--transition-fast);
    }

    .artist-card:hover .quick-play-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .quick-play-btn:hover {
      background: var(--accent-hover);
      transform: scale(1.08);
    }

    .artist-name {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
      max-width: 160px;
    }

    .artist-stats {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
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
export class ArtistsComponent implements OnInit {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  private readonly player = inject(PlayerService);

  readonly artists = signal<Artist[]>([]);
  readonly allTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  readonly filteredArtists = computed<Artist[]>(() => {
    const list = this.artists();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter((a) => a.name.toLowerCase().includes(query));
  });

  async ngOnInit(): Promise<void> {
    await this.loadArtists();
  }

  async loadArtists(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.artists.set(lib.artists);
      this.allTracks.set(lib.tracks);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load artists');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPlayArtist(event: MouseEvent, artist: Artist): void {
    event.stopPropagation();
    const trackMap = new Map<string, Track>();
    this.allTracks().forEach((t) => trackMap.set(t.id, t));

    const tracks: Track[] = [];
    artist.trackIds.forEach((id) => {
      const t = trackMap.get(id);
      if (t) tracks.push(t);
    });

    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }
}
