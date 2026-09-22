import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../core/player/player.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { QualityLabelPipe } from '../../shared/pipes/quality-label.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SpectrumVisualizerComponent } from '../../shared/components/spectrum-visualizer/spectrum-visualizer.component';

@Component({
  selector: 'app-now-playing',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe, QualityLabelPipe, IconComponent, SpectrumVisualizerComponent],
  template: `
    <div class="now-playing-page">
      @if (player.currentTrack(); as track) {
        <div class="now-playing-content">
          <!-- Left Column: Big Cover Artwork -->
          <div class="artwork-column">
            <div class="large-artwork-card">
              @if (track.artwork) {
                <img [src]="track.artwork" [alt]="track.title" class="large-artwork-img" />
              } @else {
                <div class="large-artwork-placeholder" aria-hidden="true">
                  <app-icon name="disc" [size]="80" />
                </div>
              }
            </div>
          </div>

          <!-- Right Column: Metadata & Technical Audio Specs -->
          <div class="details-column">
            <!-- Header Tags -->
            <div class="track-header-tags">
              <span class="badge-source-quality">SOURCE FILE</span>
              @if (track | qualityLabel; as label) {
                <span class="quality-text">{{ label }}</span>
              }
            </div>

            <!-- Title & Artist -->
            <h1 class="track-title" [title]="track.title">{{ track.title }}</h1>
            <div class="artist-album-row">
              <span class="track-artist">{{ track.artist || 'Unknown Artist' }}</span>
              @if (track.album) {
                <span class="dot-separator">•</span>
                <span class="track-album">{{ track.album }}</span>
              }
              @if (track.year) {
                <span class="dot-separator">•</span>
                <span class="track-year">{{ track.year }}</span>
              }
              @if (track.genre) {
                <span class="dot-separator">•</span>
                <span class="track-genre">{{ track.genre }}</span>
              }
            </div>

            <app-spectrum-visualizer />

            <!-- Embedded Timeline & Controls -->
            <div class="inline-controls">
              <div class="timeline-group">
                <span class="time-label">{{ player.currentTime() | duration }}</span>
                <div
                  class="timeline-bar-wrap"
                  (pointerdown)="onTimelinePointerDown($event)"
                  (pointermove)="onTimelinePointerMove($event)"
                  (pointerup)="onTimelinePointerUp($event)"
                  (pointercancel)="onTimelinePointerCancel($event)"
                  (keydown)="onTimelineKeyDown($event)"
                  role="slider"
                  [attr.tabindex]="player.currentTrack() && player.duration() > 0 ? 0 : -1"
                  [attr.aria-disabled]="!player.currentTrack() || player.duration() <= 0"
                  [attr.aria-valuenow]="player.currentTime()"
                  [attr.aria-valuemin]="0"
                  [attr.aria-valuemax]="player.duration()"
                  aria-label="Timeline scrubber">
                  <div class="timeline-track">
                    <div class="timeline-fill" [style.width.%]="player.progressPercent()"></div>
                  </div>
                </div>
                <span class="time-label">{{ player.duration() | duration }}</span>
              </div>

              <div class="transport-buttons">
                <button
                  type="button"
                  class="btn-icon"
                  [class.active]="player.isShuffle()"
                  (click)="player.toggleShuffle()"
                  title="Toggle Shuffle"
                  aria-label="Toggle Shuffle">
                  <app-icon name="shuffle" [size]="18" />
                </button>

                <button
                  type="button"
                  class="btn-icon"
                  (click)="player.previous()"
                  title="Previous Track"
                  aria-label="Previous Track">
                  <app-icon name="skip-back" [size]="20" />
                </button>

                <button
                  type="button"
                  class="btn-play-large"
                  (click)="player.togglePlayPause()"
                  [title]="player.isPlaybackActive() ? 'Pause' : 'Play'"
                  aria-label="Play or Pause">
                  @if (player.isPlaybackActive()) {
                    <app-icon name="pause" [size]="24" />
                  } @else {
                    <app-icon name="play" [size]="24" />
                  }
                </button>

                <button
                  type="button"
                  class="btn-icon"
                  (click)="player.next()"
                  title="Next Track"
                  aria-label="Next Track">
                  <app-icon name="skip-forward" [size]="20" />
                </button>

                <button
                  type="button"
                  class="btn-icon"
                  [class.active]="player.repeatMode() !== 'off'"
                  (click)="player.cycleRepeatMode()"
                  [title]="'Repeat Mode: ' + player.repeatMode()"
                  aria-label="Toggle Repeat Mode">
                  <app-icon [name]="player.repeatMode() === 'one' ? 'repeat-one' : 'repeat'" [size]="18" />
                </button>
              </div>
            </div>

            <!-- Technical Audio Specification Box (Source Quality) -->
            <div class="technical-specs-card">
              <div class="specs-header">
                <h3>Technical Audio Specifications (Source File)</h3>
                <span class="specs-disclaimer">
                  Verified metadata of the file on disk. (Does not claim DAC hardware output).
                </span>
              </div>

              <div class="specs-grid">
                <div class="spec-item">
                  <span class="spec-name">Codec</span>
                  <span class="spec-value">{{ track.codec || 'Unknown' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-name">Bit Depth</span>
                  <span class="spec-value">{{ track.bitDepth ? track.bitDepth + '-bit' : 'N/A' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-name">Sample Rate</span>
                  <span class="spec-value">{{ track.sampleRate ? (track.sampleRate | number) + ' Hz (' + (track.sampleRate / 1000) + ' kHz)' : 'N/A' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-name">Bitrate</span>
                  <span class="spec-value">{{ track.bitrate ? (track.bitrate / 1000 | number:'1.0-0') + ' kbps' : 'N/A' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-name">Channels</span>
                  <span class="spec-value">{{ track.channels === 2 ? 'Stereo (2 Ch)' : track.channels === 1 ? 'Mono' : track.channels ? track.channels + ' Ch' : 'N/A' }}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-name">File Size</span>
                  <span class="spec-value">{{ formatFileSize(track.fileSize) }}</span>
                </div>
              </div>

              <div class="file-path-row">
                <span class="path-label">Path:</span>
                <span class="path-value truncate" [title]="track.path">{{ track.path }}</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-screen">
          <div class="empty-icon-circle">
            <app-icon name="disc" [size]="48" />
          </div>
          <h2>Nothing is Currently Playing</h2>
          <p>Choose a track from your library or start a playlist to enjoy your music.</p>
          <a routerLink="/songs" class="btn-browse">Browse Songs</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .now-playing-page {
      height: 100%;
      overflow-y: auto;
      padding: var(--space-8);
      background: radial-gradient(circle at top right, var(--color-accent-muted), transparent 50%), var(--bg-app);
      display: flex;
      flex-direction: column;
    }

    .now-playing-content {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: var(--space-8);
      max-width: 1100px;
      margin: auto;
      width: 100%;
      align-items: center;
    }

    /* Left Artwork Column */
    .artwork-column {
      display: flex;
      justify-content: center;
    }

    .large-artwork-card {
      width: 340px;
      height: 340px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px var(--accent-glow);
      border: 1px solid var(--border-default);
    }

    .large-artwork-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .large-artwork-placeholder {
      width: 100%;
      height: 100%;
      background: var(--bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    /* Right Details Column */
    .details-column {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .track-header-tags {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-2);
    }

    .badge-source-quality {
      background: var(--accent-primary);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.05em;
    }

    .quality-text {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
      color: var(--accent-primary);
      font-weight: 600;
    }

    .track-title {
      font-size: var(--font-size-3xl);
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: var(--space-2);
    }

    .artist-album-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-2);
      font-size: var(--font-size-md);
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
    }

    .track-artist {
      color: var(--text-primary);
      font-weight: 600;
    }

    .dot-separator {
      color: var(--text-muted);
    }

    /* Inline Controls */
    .inline-controls {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .timeline-group {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .time-label {
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      color: var(--text-muted);
      min-width: 40px;
      text-align: center;
    }

    .timeline-bar-wrap {
      flex: 1;
      height: 18px;
      display: flex;
      align-items: center;
      cursor: pointer;
      touch-action: none;
    }

    .timeline-track {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      position: relative;
      overflow: hidden;
    }

    .timeline-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--radius-full);
    }

    .transport-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-6);
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      transition: color var(--transition-fast), transform var(--transition-fast);
      position: relative;
    }

    .btn-icon:hover {
      color: var(--text-primary);
      transform: scale(1.1);
    }

    .btn-icon.active {
      color: var(--accent-primary);
    }

    .btn-play-large {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 4px 16px var(--accent-glow);
      transition: background var(--transition-fast), transform var(--transition-fast);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 0;
    }

    .btn-play-large svg {
      display: block;
      flex-shrink: 0;
    }

    .btn-play-large:hover {
      background: var(--accent-hover);
      transform: scale(1.08);
    }

    /* Technical Specs Card */
    .technical-specs-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .specs-header {
      margin-bottom: var(--space-3);
    }

    .specs-header h3 {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .specs-disclaimer {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      display: block;
    }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .spec-item {
      background: var(--bg-elevated);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
    }

    .spec-name {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .spec-value {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: 600;
      font-family: var(--font-family-mono);
      margin-top: 2px;
    }

    .file-path-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      background: var(--bg-app);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
    }

    .path-label {
      font-weight: 600;
      color: var(--text-secondary);
    }

    .path-value {
      font-family: var(--font-family-mono);
    }

    /* Empty Screen */
    .empty-screen {
      margin: auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      max-width: 400px;
    }

    .empty-icon-circle {
      width: 96px;
      height: 96px;
      border-radius: var(--radius-full);
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      border: 1px solid var(--border-default);
      margin-bottom: var(--space-2);
    }

    .empty-screen h2 {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .empty-screen p {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .btn-browse {
      margin-top: var(--space-3);
      height: 38px;
      padding: 0 var(--space-6);
      background: var(--accent-primary);
      color: #ffffff;
      border-radius: var(--radius-md);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition-fast);
    }

    .btn-browse:hover {
      background: var(--accent-hover);
    }

    @media (max-width: 960px) {
      .now-playing-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .large-artwork-card {
        width: 260px;
        height: 260px;
      }
      .artist-album-row {
        justify-content: center;
      }
      .track-header-tags {
        justify-content: center;
      }
      .specs-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class NowPlayingComponent {
  readonly player = inject(PlayerService);
  private isTimelineScrubbing = false;

  onTimelinePointerDown(event: PointerEvent): void {
    if (!this.canSeek()) return;
    this.isTimelineScrubbing = true;
    const target = event.currentTarget as HTMLElement;
    try { target.setPointerCapture(event.pointerId); } catch { /* Synthetic events may not own a pointer. */ }
    this.seekFromClientX(event.clientX, target);
    event.preventDefault();
  }

  onTimelinePointerMove(event: PointerEvent): void {
    if (!this.isTimelineScrubbing) return;
    this.seekFromClientX(event.clientX, event.currentTarget as HTMLElement);
  }

  onTimelinePointerUp(event: PointerEvent): void {
    if (!this.isTimelineScrubbing) return;
    this.seekFromClientX(event.clientX, event.currentTarget as HTMLElement);
    this.finishTimelineScrub(event);
  }

  onTimelinePointerCancel(event: PointerEvent): void {
    this.finishTimelineScrub(event);
  }

  onTimelineKeyDown(event: KeyboardEvent): void {
    if (!this.canSeek()) return;
    const duration = this.player.duration();
    let nextPosition: number | null = null;
    if (event.key === 'ArrowLeft') nextPosition = this.player.currentTime() - 5;
    else if (event.key === 'ArrowRight') nextPosition = this.player.currentTime() + 5;
    else if (event.key === 'Home') nextPosition = 0;
    else if (event.key === 'End') nextPosition = duration;
    if (nextPosition === null) return;
    event.preventDefault();
    this.player.seek(Math.max(0, Math.min(duration, nextPosition)));
  }

  private seekFromClientX(clientX: number, target: HTMLElement): void {
    const totalDuration = this.player.duration();
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || totalDuration <= 0) return;
    const clickX = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    this.player.seek(percent * totalDuration);
  }

  private finishTimelineScrub(event: PointerEvent): void {
    this.isTimelineScrubbing = false;
    const target = event.currentTarget as HTMLElement;
    try {
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    } catch { /* Pointer capture may already be released. */ }
  }

  private canSeek(): boolean {
    return Boolean(this.player.currentTrack()) && this.player.duration() > 0;
  }

  formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
}
