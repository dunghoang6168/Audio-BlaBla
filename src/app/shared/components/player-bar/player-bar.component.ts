import { Component, HostListener, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../../core/player/player.service';
import { DurationPipe } from '../../pipes/duration.pipe';
import { QualityLabelPipe } from '../../pipes/quality-label.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-player-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe, QualityLabelPipe, IconComponent],
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
                <app-icon name="disc" [size]="20" />
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
            <app-icon name="disc" [size]="20" />
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
            <app-icon name="shuffle" [size]="16" />
          </button>

          <!-- Previous Button -->
          <button
            type="button"
            class="ctrl-btn"
            (click)="player.previous()"
            [disabled]="!player.currentTrack()"
            title="Previous (P)"
            aria-label="Previous Track">
            <app-icon name="skip-back" [size]="18" />
          </button>

          <!-- Play / Pause Button -->
          <button
            type="button"
            class="play-pause-btn"
            (click)="player.togglePlayPause()"
            [disabled]="!player.currentTrack() && player.queue().length === 0"
            [title]="player.isPlaybackActive() ? 'Pause (Space)' : 'Play (Space)'"
            [attr.aria-label]="player.isPlaybackActive() ? 'Pause' : 'Play'">
            @if (player.isPlaybackActive()) {
              <app-icon name="pause" [size]="18" />
            } @else {
              <app-icon name="play" [size]="18" />
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
            <app-icon name="skip-forward" [size]="18" />
          </button>

          <!-- Repeat Mode Button -->
          <button
            type="button"
            class="ctrl-btn"
            [class.active]="player.repeatMode() !== 'off'"
            (click)="player.cycleRepeatMode()"
            [title]="'Repeat Mode: ' + player.repeatMode() + ' (R)'"
            aria-label="Toggle Repeat Mode">
            <app-icon [name]="player.repeatMode() === 'one' ? 'repeat-one' : 'repeat'" [size]="16" />
          </button>
        </div>

        <!-- Timeline Row -->
        <div class="timeline-row">
          <span class="time-label">{{ player.currentTime() | duration }}</span>
          <div
            class="progress-bar-wrap"
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
            <app-icon [name]="player.isMuted() || player.volume() === 0 ? 'volume-x' : 'volume-2'" [size]="18" />
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
          <app-icon name="queue" [size]="18" />
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
      background: var(--color-surface);
      border-top: 1px solid var(--color-border-subtle);
      transition: background-color var(--transition-normal), border-color var(--transition-normal), color var(--transition-normal);
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
      height: 32px;
    }

    .ctrl-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      transition: color var(--transition-fast), background var(--transition-fast);
      position: relative;
    }

    .ctrl-btn:hover:not(:disabled) {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .ctrl-btn.active {
      color: var(--accent-primary);
    }

    .play-pause-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 2px 8px var(--accent-glow);
      transition: background var(--transition-fast), box-shadow var(--transition-fast);
      padding: 0;
      line-height: 0;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .play-pause-btn svg {
      display: block;
      flex-shrink: 0;
    }

    .play-pause-btn:hover:not(:disabled) {
      background: var(--accent-hover);
      box-shadow: 0 2px 10px var(--accent-glow);
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
      touch-action: none;
    }

    .progress-bar-track {
      width: 100%;
      height: 4px;
      background: var(--color-border);
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
      background: var(--color-accent-muted);
      border: 1px solid var(--color-accent-glow);
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
      background: var(--color-border);
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

    @media (max-width: 900px) {
      .player-bar {
        grid-template-columns: 180px 1fr 180px;
        padding: 0 var(--space-2);
      }
      .volume-bar-wrap {
        width: 60px;
      }
      .buttons-row {
        gap: var(--space-2);
      }
    }
  `]
})
export class PlayerBarComponent {
  readonly player = inject(PlayerService);
  readonly isQueueOpen = input<boolean>(false);
  readonly toggleQueue = output<void>();

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

  onVolumeClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
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
