import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LIBRARY_GATEWAY } from '../../../core/contracts';
import { Album, Artist, Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe],
  template: `
    <div class="artist-detail-page">
      <nav class="breadcrumb">
        <a routerLink="/artists" class="back-link">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Artists
        </a>
      </nav>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading artist profile...</p>
        </div>
      } @else if (!artist()) {
        <div class="empty-state">
          <h2>Artist Not Found</h2>
          <p>The requested artist was not found in your library.</p>
          <a routerLink="/artists" class="btn-back">Browse Artists</a>
        </div>
      } @else {
        <!-- Artist Hero -->
        <header class="artist-hero">
          <div class="artist-avatar">
            <span class="initial">{{ artist()?.name?.charAt(0) }}</span>
          </div>

          <div class="hero-info">
            <span class="type-tag">ARTIST</span>
            <h1 class="artist-name">{{ artist()?.name }}</h1>
            <p class="artist-stats">
              {{ artistAlbums().length }} {{ artistAlbums().length === 1 ? 'Album' : 'Albums' }} •
              {{ artistTracks().length }} Tracks
            </p>

            <div class="hero-actions">
              <button
                type="button"
                class="btn-play"
                (click)="onPlayAll()"
                [disabled]="artistTracks().length === 0">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Play All Songs
              </button>
            </div>
          </div>
        </header>

        <!-- Discography / Albums Section -->
        @if (artistAlbums().length > 0) {
          <section class="section-albums">
            <h2 class="section-title">Albums</h2>
            <div class="albums-grid">
              @for (album of artistAlbums(); track album.id) {
                <div class="album-card" [routerLink]="['/albums', album.id]" tabindex="0" role="button">
                  <div class="cover-box">
                    @if (album.artwork) {
                      <img [src]="album.artwork" [alt]="album.title" class="cover-img" />
                    } @else {
                      <div class="cover-placeholder" aria-hidden="true">♪</div>
                    }
                  </div>
                  <h4 class="album-title truncate" [title]="album.title">{{ album.title }}</h4>
                  <span class="album-year">{{ album.year || 'Unknown Year' }}</span>
                </div>
              }
            </div>
          </section>
        }

        <!-- Songs Section -->
        <section class="section-songs">
          <h2 class="section-title">Songs ({{ artistTracks().length }})</h2>
          <div class="tracks-card">
            <table class="tracks-table">
              <thead>
                <tr>
                  <th class="col-num">#</th>
                  <th class="col-title">Title</th>
                  <th class="col-album">Album</th>
                  <th class="col-duration">Time</th>
                </tr>
              </thead>
              <tbody>
                @for (track of artistTracks(); track track.id; let i = $index) {
                  <tr
                    class="track-row"
                    [class.playing]="player.currentTrack()?.id === track.id"
                    [class.unavailable]="!track.isAvailable"
                    (dblclick)="onPlayTrack(track, i)"
                    tabindex="0"
                    (keydown.enter)="onPlayTrack(track, i)">
                    <td class="col-num">
                      @if (player.currentTrack()?.id === track.id) {
                        <span class="playing-icon">▶</span>
                      } @else {
                        {{ i + 1 }}
                      }
                    </td>
                    <td class="col-title">
                      <span class="track-title truncate" [title]="track.title">{{ track.title }}</span>
                      @if (!track.isAvailable) {
                        <span class="badge-unavailable">Unavailable</span>
                      }
                    </td>
                    <td class="col-album truncate" [title]="track.album || 'Unknown'">
                      {{ track.album || '—' }}
                    </td>
                    <td class="col-duration">
                      {{ track.duration | duration }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .artist-detail-page {
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
      font-weight: 500;
    }

    .back-link:hover { color: var(--accent-primary); }

    .artist-hero {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
      flex-wrap: wrap;
    }

    .artist-avatar {
      width: 140px;
      height: 140px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #3b0764, #1e1b4b);
      border: 2px solid var(--border-default);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      flex-shrink: 0;
    }

    .initial {
      font-size: 56px;
      font-weight: 800;
      color: var(--accent-primary);
    }

    .hero-info {
      flex: 1;
      min-width: 240px;
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

    .artist-name {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      margin-bottom: var(--space-2);
    }

    .artist-stats {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
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
      transition: background var(--transition-fast);
      align-self: flex-start;
    }

    .btn-play:hover:not(:disabled) {
      background: var(--accent-hover);
    }

    .section-title {
      font-size: var(--font-size-lg);
      font-weight: 700;
      margin-bottom: var(--space-4);
      color: var(--text-primary);
    }

    .section-albums {
      margin-bottom: var(--space-8);
    }

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
      transition: transform var(--transition-fast), background var(--transition-fast);
    }

    .album-card:hover {
      background: var(--bg-surface-hover);
      transform: translateY(-3px);
    }

    .cover-box {
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

    .album-title {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .album-year {
      font-size: 11px;
      color: var(--text-muted);
    }

    .tracks-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .tracks-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    .tracks-table th {
      padding: var(--space-3) var(--space-4);
      color: var(--text-muted);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
    }

    .track-row {
      height: 44px;
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .track-row:hover {
      background: var(--bg-surface-hover);
    }

    .track-row.playing {
      color: var(--accent-primary);
    }

    .track-row.playing .track-title {
      color: var(--accent-primary);
      font-weight: 600;
    }

    .track-row.unavailable {
      opacity: 0.45;
    }

    .tracks-table td {
      padding: var(--space-2) var(--space-4);
      vertical-align: middle;
    }

    .col-num { width: 44px; text-align: center; color: var(--text-muted); }
    .col-title { min-width: 250px; }
    .col-album { width: 220px; color: var(--text-secondary); }
    .col-duration { width: 80px; font-family: var(--font-family-mono); color: var(--text-muted); }

    .playing-icon { color: var(--accent-primary); font-size: 11px; }

    .badge-unavailable {
      font-size: 10px;
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      margin-left: var(--space-2);
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

    .btn-back {
      display: inline-block;
      margin-top: var(--space-4);
      padding: var(--space-2) var(--space-4);
      background: var(--accent-primary);
      color: #ffffff;
      border-radius: var(--radius-md);
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class ArtistDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);

  readonly artist = signal<Artist | null>(null);
  readonly artistAlbums = signal<Album[]>([]);
  readonly artistTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    const artistId = this.route.snapshot.paramMap.get('id');
    if (!artistId) {
      this.isLoading.set(false);
      return;
    }

    try {
      const lib = await this.libraryGateway.getLibrary();
      const foundArtist = lib.artists.find((a) => a.id === artistId) || null;
      this.artist.set(foundArtist);

      if (foundArtist) {
        // Albums by this artist
        const albums = lib.albums.filter((a) => foundArtist.albumIds.includes(a.id));
        this.artistAlbums.set(albums);

        // Tracks by this artist
        const trackMap = new Map<string, Track>();
        lib.tracks.forEach((t) => trackMap.set(t.id, t));

        const tracks: Track[] = [];
        foundArtist.trackIds.forEach((id) => {
          const t = trackMap.get(id);
          if (t) tracks.push(t);
        });

        this.artistTracks.set(tracks);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  onPlayAll(): void {
    const tracks = this.artistTracks();
    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }

  onPlayTrack(track: Track, index: number): void {
    if (!track.isAvailable) return;
    this.player.playCollection(this.artistTracks(), index);
  }
}
