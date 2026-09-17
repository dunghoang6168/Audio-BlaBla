import { Component, ElementRef, HostListener, ViewChild, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../../core/player/player.service';
import { DurationPipe } from '../../pipes/duration.pipe';
import { QualityLabelPipe } from '../../pipes/quality-label.pipe';

@Component({
  selector: 'app-player-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe, QualityLabelPipe],
  template: `
    <footer class="player-bar" role="region" aria-label="Audio Player">
      <!-- Left: Current Track Info (Click opens Now Playing) -->
      <div class="track-info">
        @if (player.currentTrack(); as track) {
          <a routerLink="/now-playing" class="artwork-link" title="Open Now Playing screen">
            @if (track.artwork) {
              <img [src]="track.artwork" [alt]="track.title" class="artwork-img" />
            } @else {
              <div class="artwork-placeholder" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
            }
          </a>
          <div class="track-meta">
            <a routerLink="/now-playing" class="track-title truncate" [title]="track.title">
              {{ track.title }}
            </a>
            <span class="track-artist truncate" [title]="track.artist || 'Unknown Artist'">
              {{ track.artist || 'Unknown Artist' }}
            </span>
          </div>
        } @else {
          <div class="artwork-placeholder empty" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div class="track-meta">
            <span class="track-title empty truncate">No track selected</span>
            <span class="track-artist truncate">Double click a song to start</span>
          </div>
        }
      </div>

      <!-- Center: Controls & Timeline -->
      <div class="player-controls-container">
        <div class="buttons-row">
          <!-- Shuffle Button -->
          <button
            type="button"
            class="ctrl-btn"
            [class.active]="player.isShuffle()"
            (click)="player.toggleShuffle()"
            [disabled]="player.queue().length === 0"
            title="Shuffle (S)"
            aria-label="Toggle Shuffle">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </button>

          <!-- Previous Button -->
          <button
            type="button"
            class="ctrl-btn"
            (click)="player.previous()"
            [disabled]="!player.currentTrack()"
            title="Previous (P)"
            aria-label="Previous Track">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
          </button>

          <!-- Play / Pause Button -->
          <button
            type="button"
            class="play-pause-btn"
            (click)="player.togglePlayPause()"
            [disabled]="!player.currentTrack() && player.queue().length === 0"
            [title]="player.isPlaying() ? 'Pause (Space)' : 'Play (Space)'"
            [attr.aria-label]="player.isPlaying() ? 'Pause' : 'Play'">
            @if (player.isLoading()) {
              <div class="btn-spinner" aria-hidden="true"></div>
            } @else if (player.isPlaying()) {
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4"></polygon>
              </svg>
            }
          </button>

          <!-- Next Button -->
          <button
            type="button"
            class="ctrl-btn"
            (click)="player.next()"
            [disabled]="!player.currentTrack()"
            title="Next (N)"
            aria-label="Next Track">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>

          <!-- Repeat Mode Button -->
          <button
            type="button"
            class="ctrl-btn"
            [class.active]="player.repeatMode() !== 'off'"
            (click)="player.cycleRepeatMode()"
            [title]="'Repeat Mode: ' + player.repeatMode() + ' (R)'"
            aria-label="Toggle Repeat Mode">
            @if (player.repeatMode() === 'one') {
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                <text x="10" y="15" font-size="8" font-weight="bold" fill="currentColor" stroke="none">1</text>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            }
          </button>
        </div>

        <!-- Timeline Row -->
        <div class="timeline-row">
          <span class="time-label">{{ player.currentTime() | duration }}</span>
          <div
            #timelineWrap
            class="progress-bar-wrap"
            (click)="onSeekClick($event)"
            role="slider"
            [attr.aria-valuenow]="player.currentTime()"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="player.duration()"
            aria-label="Timeline scrubber">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" [style.width.%]="player.progressPercent()"></div>
            </div>
          </div>
          <span class="time-label">{{ player.duration() | duration }}</span>
        </div>
      </div>

      <!-- Right: Dynamic Source Quality, Volume & Queue Drawer Toggle -->
      <div class="player-extras">
        <!-- Dynamic Source Quality Badge (Only shown when a track is active) -->
        @if (player.currentTrack(); as track) {
          @if (track | qualityLabel; as label) {
            <div class="quality-tag" title="Source file quality (Format of the file on disk; not claiming DAC output)">
              <span class="quality-label">SOURCE QUALITY</span>
              <span class="quality-value">{{ label }}</span>
            </div>
          }
        }

        <!-- Volume Container -->
        <div class="volume-container">
          <button
            type="button"
            class="ctrl-btn"
            (click)="player.toggleMute()"
            [title]="player.isMuted() ? 'Unmute (M)' : 'Mute (M)'"
            aria-label="Mute or Unmute">
            @if (player.isMuted() || player.volume() === 0) {
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            }
          </button>
          <div
            #volumeWrap
            class="volume-bar-wrap"
            (click)="onVolumeClick($event)"
            role="slider"
            [attr.aria-valuenow]="player.isMuted() ? 0 : player.volume() * 100"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="100"
            aria-label="Volume slider">
            <div class="volume-bar-track">
              <div class="volume-bar-fill" [style.width.%]="player.isMuted() ? 0 : player.volume() * 100"></div>
            </div>
          </div>
        </div>

        <!-- Queue Drawer Toggle -->
        <button
          type="button"
          class="queue-btn"
          [class.active]="isQueueOpen()"
          (click)="toggleQueue.emit()"
          title="Toggle Queue Drawer (Q)"
          aria-label="Toggle Playback Queue Drawer">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          @if (player.queue().length > 0) {
            <span class="queue-badge">{{ player.queue().length }}</span>
          }
        </button>
      </div>
    </footer>
  `,
  styles: [`
    .player-bar {
      height: var(--player-bar-height);
      background: var(--bg-surface);
      border-top: 1px solid var(--border-subtle);
      display: grid;
      grid-template-columns: 280px 1fr 320px;
      align-items: center;
      padding: 0 var(--space-4);
      flex-shrink: 0;
      user-select: none;
      z-index: 10;
    }

    /* Left: Track Info */
    .track-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-width: 0;
    }

    .artwork-link {
      flex-shrink: 0;
      text-decoration: none;
    }

    .artwork-img {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      object-fit: cover;
      border: 1px solid var(--border-subtle);
      transition: transform var(--transition-fast), border-color var(--transition-fast);
    }

    .artwork-img:hover {
      transform: scale(1.04);
      border-color: var(--accent-primary);
    }

    .artwork-placeholder {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
      transition: border-color var(--transition-fast);
    }

    .artwork-placeholder.empty {
      opacity: 0.5;
    }

    .track-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .track-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .track-title:hover {
      color: var(--accent-primary);
    }

    .track-title.empty {
      color: var(--text-muted);
      font-weight: 500;
    }

    .track-artist {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    /* Center: Transport & Progress */
    .player-controls-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      max-width: 600px;
      margin: 0 auto;
      width: 100%;
    }

    .buttons-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .ctrl-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      transition: color var(--transition-fast), transform var(--transition-fast);
      position: relative;
    }

    .ctrl-btn:hover:not(:disabled) {
      color: var(--text-primary);
      transform: scale(1.08);
    }

    .ctrl-btn.active {
      color: var(--accent-primary);
    }

    .play-pause-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 2px 8px var(--accent-glow);
      transition: background var(--transition-fast), transform var(--transition-fast);
    }

    .play-pause-btn:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: scale(1.08);
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 800ms linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .timeline-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
    }

    .time-label {
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      color: var(--text-muted);
      min-width: 38px;
      text-align: center;
    }

    .progress-bar-wrap {
      flex: 1;
      height: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .progress-bar-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      position: relative;
      overflow: hidden;
      transition: height var(--transition-fast);
    }

    .progress-bar-wrap:hover .progress-bar-track {
      height: 6px;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--radius-full);
    }

    /* Right: Extras */
    .player-extras {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-4);
    }

    .quality-tag {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      background: rgba(139, 92, 246, 0.08);
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .quality-label {
      font-size: 9px;
      font-weight: 700;
      color: var(--accent-primary);
      letter-spacing: 0.05em;
    }

    .quality-value {
      font-size: 11px;
      color: var(--text-secondary);
      font-family: var(--font-family-mono);
      white-space: nowrap;
    }

    .volume-container {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 120px;
    }

    .volume-bar-wrap {
      flex: 1;
      height: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .volume-bar-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      position: relative;
      overflow: hidden;
      transition: height var(--transition-fast);
    }

    .volume-bar-wrap:hover .volume-bar-track {
      height: 6px;
    }

    .volume-bar-fill {
      height: 100%;
      background: var(--text-secondary);
      border-radius: var(--radius-full);
    }

    .queue-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      transition: color var(--transition-fast), background var(--transition-fast);
      position: relative;
    }

    .queue-btn:hover {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .queue-btn.active {
      color: var(--accent-primary);
      background: var(--accent-muted);
      border-color: var(--accent-primary);
    }

    .queue-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--accent-primary);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      border-radius: var(--radius-full);
      padding: 1px 5px;
      line-height: 1;
    }

    @media (max-width: 1024px) {
      .player-bar {
        grid-template-columns: 220px 1fr 220px;
      }
      .quality-tag {
        display: none;
      }
    }
  `]
})
export class PlayerBarComponent {
  readonly player = inject(PlayerService);
  readonly isQueueOpen = input<boolean>(false);
  readonly toggleQueue = output<void>();

  @ViewChild('timelineWrap') timelineRef!: ElementRef<HTMLDivElement>;
  @ViewChild('volumeWrap') volumeRef!: ElementRef<HTMLDivElement>;

  onSeekClick(event: MouseEvent): void {
    const totalDuration = this.player.duration();
    if (!this.timelineRef || totalDuration <= 0) return;

    const rect = this.timelineRef.nativeElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    this.player.seek(percent * totalDuration);
  }

  onVolumeClick(event: MouseEvent): void {
    if (!this.volumeRef) return;
    const rect = this.volumeRef.nativeElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    this.player.setVolume(percent);
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    const activeEl = document.activeElement as HTMLElement | null;
    const activeTag = (activeEl?.tagName || '').toLowerCase();

    // Skip global playback toggle if focus is inside form fields, buttons, links, or contenteditable
    if (
      activeTag === 'input' ||
      activeTag === 'textarea' ||
      activeTag === 'select' ||
      activeTag === 'button' ||
      activeTag === 'a' ||
      activeEl?.getAttribute('role') === 'button' ||
      activeEl?.isContentEditable
    ) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.player.togglePlayPause();
    }
  }
}
