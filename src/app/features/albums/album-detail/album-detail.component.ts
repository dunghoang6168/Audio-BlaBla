import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LIBRARY_GATEWAY } from '../../../core/contracts';
import { Album, orderAlbumTracks, Track } from '../../../core/models';
import { PlayerService } from '../../../core/player/player.service';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface DiscGroup {
  discNumber: number;
  tracks: Track[];
}

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe, IconComponent],
  template: `
    <div class="album-detail-page">
      <nav class="breadcrumb">
        <a routerLink="/albums" class="back-link">
          <app-icon name="chevron-left" [size]="16" />
          Back to Albums
        </a>
      </nav>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading album details...</p>
        </div>
      } @else if (!album()) {
        <div class="empty-state">
          <h2>Album Not Found</h2>
          <p>The requested album could not be found in your music library.</p>
          <a routerLink="/albums" class="btn-back">Browse Albums</a>
        </div>
      } @else {
        <!-- Album Header Hero -->
        <header class="album-hero">
          <div class="hero-artwork-wrapper">
            @if (album()?.artwork) {
              <img [src]="album()?.artwork" [alt]="album()?.title" class="hero-artwork-img" />
            } @else {
              <div class="hero-artwork-placeholder" aria-hidden="true">
                <app-icon name="disc" [size]="64" />
              </div>
            }
          </div>

          <div class="hero-info">
            <span class="type-tag">ALBUM</span>
            <h1 class="album-title">{{ album()?.title }}</h1>

            <div class="album-meta-row">
              <span class="artist-name">{{ album()?.artist || 'Unknown Artist' }}</span>
              <span class="dot">•</span>
              <span class="album-year">{{ album()?.year || 'Unknown Year' }}</span>
              <span class="dot">•</span>
              <span>{{ albumTracks().length }} tracks, {{ totalDuration() }}</span>
            </div>

            <div class="hero-actions">
              <button
                type="button"
                class="btn-play"
                (click)="onPlayAll()"
                [disabled]="albumTracks().length === 0"
                aria-label="Play Album">
                <app-icon name="play" [size]="18" />
                Play Album
              </button>

              <button
                type="button"
                class="btn-shuffle"
                (click)="onShufflePlay()"
                [disabled]="albumTracks().length === 0"
                aria-label="Shuffle Album">
                <app-icon name="shuffle" [size]="16" />
                Shuffle
              </button>
            </div>
          </div>
        </header>

        <!-- Disc Groups & Track List -->
        <div class="tracklist-container">
          @for (group of discGroups(); track group.discNumber) {
            <div class="disc-section">
              @if (discGroups().length > 1) {
                <div class="disc-header">
                  <app-icon name="disc" [size]="16" />
                  <span>Disc {{ group.discNumber }}</span>
                </div>
              }

              <table class="tracks-table">
                <thead>
                  <tr>
                    <th class="col-num">#</th>
                    <th class="col-title">Title</th>
                    <th class="col-duration">Time</th>
                    <th class="col-spec">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  @for (track of group.tracks; track track.id; let i = $index) {
                    <tr
                      class="track-row"
                      [class.playing]="player.currentTrack()?.id === track.id"
                      [class.unavailable]="!track.isAvailable"
                      (dblclick)="onPlayTrack(track)"
                      (keydown.enter)="onPlayTrack(track)"
                      tabindex="0">
                      <td class="col-num">
                        @if (player.currentTrack()?.id === track.id) {
                          <span class="playing-icon">
                            <app-icon name="play" [size]="12" />
                          </span>
                        } @else {
                          {{ track.trackNumber || i + 1 }}
                        }
                      </td>

                      <td class="col-title">
                        <span class="track-title" [title]="track.title">{{ track.title }}</span>
                        @if (!track.isAvailable) {
                          <span class="badge-unavailable">Unavailable</span>
                        }
                      </td>

                      <td class="col-duration">
                        {{ track.duration | duration }}
                      </td>

                      <td class="col-spec">
                        <span class="spec-tag">{{ track.codec }}</span>
                        @if (track.sampleRate) {
                          <span class="spec-detail">{{ track.sampleRate / 1000 }} kHz</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .album-detail-page {
      padding: var(--space-6);
      height: 100%;
      overflow-y: auto;
    }

    .breadcrumb {
      margin-bottom: var(--space-4);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .back-link:hover {
      color: var(--accent-primary);
    }

    /* Hero */
    .album-hero {
      display: flex;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .hero-artwork-wrapper {
      width: 200px;
      height: 200px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--bg-surface);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-default);
      flex-shrink: 0;
    }

    .hero-artwork-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-artwork-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .hero-info {
      flex: 1;
      min-width: 280px;
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

    .album-title {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: var(--space-2);
    }

    .album-meta-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
    }

    .artist-name {
      color: var(--text-primary);
      font-weight: 600;
    }

    .dot {
      color: var(--text-muted);
      font-size: 8px;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
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
      transition: background var(--transition-fast), transform var(--transition-fast);
    }

    .btn-play:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: scale(1.02);
    }

    .btn-shuffle {
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
      transition: background var(--transition-fast);
    }

    .btn-shuffle:hover:not(:disabled) {
      background: var(--bg-surface-hover);
    }

    /* Tracklist */
    .tracklist-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .disc-section {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .disc-header {
      padding: var(--space-3) var(--space-4);
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-subtle);
      font-size: var(--font-size-xs);
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: var(--space-2);
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
    .col-duration { width: 80px; font-family: var(--font-family-mono); color: var(--text-muted); }
    .col-spec { width: 140px; text-align: right; }

    .playing-icon {
      color: var(--accent-primary);
      font-size: 11px;
    }

    .badge-unavailable {
      font-size: 10px;
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      margin-left: var(--space-2);
    }

    .spec-tag {
      font-size: 10px;
      font-family: var(--font-family-mono);
      font-weight: 700;
      color: var(--text-muted);
      background: var(--bg-elevated);
      padding: 1px 5px;
      border-radius: var(--radius-sm);
    }

    .spec-detail {
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-family-mono);
      margin-left: var(--space-1);
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
export class AlbumDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);

  readonly album = signal<Album | null>(null);
  readonly albumTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly orderedAlbumTracks = computed<Track[]>(() => orderAlbumTracks(this.albumTracks()));

  readonly discGroups = computed<DiscGroup[]>(() => {
    const tracks = this.orderedAlbumTracks();
    const map = new Map<number, Track[]>();

    tracks.forEach((t) => {
      const disc = t.discNumber ?? 1;
      if (!map.has(disc)) map.set(disc, []);
      map.get(disc)!.push(t);
    });

    const groups: DiscGroup[] = [];
    map.forEach((discTracks, discNumber) => {
      groups.push({ discNumber, tracks: discTracks });
    });

    return groups;
  });

  readonly totalDuration = computed<string>(() => {
    const totalSecs = this.albumTracks().reduce((acc, t) => acc + t.duration, 0);
    const mins = Math.floor(totalSecs / 60);
    return `${mins} min`;
  });

  async ngOnInit(): Promise<void> {
    const albumId = this.route.snapshot.paramMap.get('id');
    if (!albumId) {
      this.isLoading.set(false);
      return;
    }

    try {
      const lib = await this.libraryGateway.getLibrary();
      const foundAlbum = lib.albums.find((a) => a.id === albumId) || null;
      this.album.set(foundAlbum);

      if (foundAlbum) {
        const trackMap = new Map<string, Track>();
        lib.tracks.forEach((t) => trackMap.set(t.id, t));

        const tracks: Track[] = [];
        foundAlbum.trackIds.forEach((id) => {
          const t = trackMap.get(id);
          if (t) tracks.push(t);
        });

        this.albumTracks.set(tracks);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  onPlayAll(): void {
    const tracks = this.orderedAlbumTracks();
    if (tracks.length > 0) {
      this.player.setShuffle(false);
      this.player.playCollection(tracks, 0);
    }
  }

  onShufflePlay(): void {
    const tracks = this.orderedAlbumTracks();
    if (tracks.length > 0) {
      this.player.setShuffle(true);
      this.player.playCollection(tracks, 0);
    }
  }

  onPlayTrack(track: Track): void {
    if (!track.isAvailable) return;
    const tracks = this.orderedAlbumTracks();
    const idx = tracks.findIndex((t) => t.id === track.id);
    this.player.setShuffle(false);
    this.player.playCollection(tracks, Math.max(0, idx));
  }
}
