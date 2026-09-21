import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LIBRARY_GATEWAY, PLAYLIST_GATEWAY } from '../../core/contracts';
import { Album, Playlist, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="home-page">
      <!-- Welcome Hero -->
      <!-- <section class="welcome-hero">
        <div class="hero-text">
          <h1>Welcome to Audio BlaBla</h1>
          <p class="subtitle">Your high-fidelity offline desktop music player. Browse by tags, artist discographies, or filesystem hierarchy.</p>
        </div>
      </section> -->

      <!-- Library Statistics Counter Cards -->
      <section class="stats-row">
        <a routerLink="/songs" class="stat-card">
          <div class="stat-icon-box songs">
            <app-icon name="music" [size]="22" />
          </div>
          <div class="stat-meta">
            <span class="stat-count">{{ tracksCount() }}</span>
            <span class="stat-label">Tracks</span>
          </div>
        </a>

        <a routerLink="/albums" class="stat-card">
          <div class="stat-icon-box albums">
            <app-icon name="disc" [size]="22" />
          </div>
          <div class="stat-meta">
            <span class="stat-count">{{ albumsCount() }}</span>
            <span class="stat-label">Albums</span>
          </div>
        </a>

        <a routerLink="/artists" class="stat-card">
          <div class="stat-icon-box artists">
            <app-icon name="user" [size]="22" />
          </div>
          <div class="stat-meta">
            <span class="stat-count">{{ artistsCount() }}</span>
            <span class="stat-label">Artists</span>
          </div>
        </a>

        <a routerLink="/folders" class="stat-card">
          <div class="stat-icon-box folders">
            <app-icon name="folder" [size]="22" />
          </div>
          <div class="stat-meta">
            <span class="stat-count">{{ foldersCount() }}</span>
            <span class="stat-label">Music Roots</span>
          </div>
        </a>
      </section>

      <!-- Featured Albums Section -->
      <section class="home-section">
        <div class="section-header">
          <h2>Featured Albums</h2>
          <a routerLink="/albums" class="see-all-link">See All &rarr;</a>
        </div>

        <div class="albums-grid">
          @for (album of featuredAlbums(); track album.id) {
            <div class="album-card" [routerLink]="['/albums', album.id]" tabindex="0" role="button">
              <div class="cover-wrapper">
                @if (album.artwork) {
                  <img [src]="album.artwork" [alt]="album.title" class="cover-img" />
                } @else {
                  <div class="cover-placeholder" aria-hidden="true">
                    <app-icon name="disc" [size]="36" />
                  </div>
                }

                <button
                  type="button"
                  class="quick-play-btn"
                  (click)="onPlayAlbum($event, album)"
                  title="Play Album"
                  aria-label="Play Album">
                  <app-icon name="play" [size]="18" />
                </button>
              </div>
              <h3 class="album-title truncate" [title]="album.title">{{ album.title }}</h3>
              <p class="album-artist truncate">{{ album.artist || 'Unknown Artist' }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Quick Playlists Section -->
      <section class="home-section">
        <div class="section-header">
          <h2>Playlists</h2>
          <a routerLink="/playlists" class="see-all-link">Manage &rarr;</a>
        </div>

        <div class="playlists-row">
          @for (pl of playlists(); track pl.id) {
            <a [routerLink]="['/playlists', pl.id]" class="playlist-pill">
              <app-icon name="list-music" [size]="16" class="pill-icon" />
              <span class="pill-title truncate">{{ pl.name }}</span>
              <span class="pill-count">({{ pl.entries.length }})</span>
            </a>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-page {
      padding: var(--space-8);
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .welcome-hero {
      background: linear-gradient(135deg, var(--color-accent-muted), var(--color-surface-elevated));
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      box-shadow: var(--shadow-md);
    }

    .welcome-hero h1 {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-2);
    }

    .subtitle {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      max-width: 680px;
      line-height: 1.6;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-4);
    }

    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      text-decoration: none;
      color: inherit;
      transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
    }

    .stat-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-2px);
      border-color: var(--color-accent-glow);
    }

    .stat-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-box.songs { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .stat-icon-box.albums { background: rgba(139, 92, 246, 0.15); color: #c084fc; }
    .stat-icon-box.artists { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
    .stat-icon-box.folders { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; }

    .stat-meta {
      display: flex;
      flex-direction: column;
    }

    .stat-count {
      font-size: var(--font-size-2xl);
      font-weight: 800;
      line-height: 1;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .home-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-header h2 {
      font-size: var(--font-size-xl);
      font-weight: 700;
    }

    .see-all-link {
      font-size: var(--font-size-sm);
      color: var(--accent-primary);
      text-decoration: none;
      font-weight: 600;
    }

    .see-all-link:hover { text-decoration: underline; }

    .albums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--space-4);
    }

    .album-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: transform var(--transition-fast), background var(--transition-fast);
    }

    .album-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-3px);
    }

    .cover-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-elevated);
      margin-bottom: var(--space-2);
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
      font-size: 24px;
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

    .album-card:hover .quick-play-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .album-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .album-artist {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .playlists-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .playlist-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-4);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-primary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: 500;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }

    .playlist-pill:hover {
      background: var(--bg-surface-hover);
      border-color: var(--accent-primary);
    }

    .pill-icon { color: var(--accent-primary); }
    .pill-count { color: var(--text-muted); font-size: var(--font-size-xs); }
  `]
})
export class HomeComponent implements OnInit {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  private readonly playlistGateway = inject(PLAYLIST_GATEWAY);
  readonly player = inject(PlayerService);

  readonly tracksCount = signal<number>(0);
  readonly albumsCount = signal<number>(0);
  readonly artistsCount = signal<number>(0);
  readonly foldersCount = signal<number>(0);
  readonly featuredAlbums = signal<Album[]>([]);
  readonly playlists = signal<Playlist[]>([]);
  private allTracks: Track[] = [];

  async ngOnInit(): Promise<void> {
    const [lib, pls] = await Promise.all([
      this.libraryGateway.getLibrary(),
      this.playlistGateway.getPlaylists(),
    ]);

    this.allTracks = lib.tracks;
    this.tracksCount.set(lib.tracks.length);
    this.albumsCount.set(lib.albums.length);
    this.artistsCount.set(lib.artists.length);
    this.foldersCount.set(lib.folders.length);
    this.featuredAlbums.set(lib.albums.slice(0, 5));
    this.playlists.set(pls);
  }

  onPlayAlbum(event: MouseEvent, album: Album): void {
    event.stopPropagation();
    const trackMap = new Map<string, Track>();
    this.allTracks.forEach((t) => trackMap.set(t.id, t));

    const tracks: Track[] = [];
    album.trackIds.forEach((id) => {
      const t = trackMap.get(id);
      if (t) tracks.push(t);
    });

    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }
}
