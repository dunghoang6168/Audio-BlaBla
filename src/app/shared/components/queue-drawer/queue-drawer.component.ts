import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../../core/player/player.service';
import { QueueEntry } from '../../../core/models';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-queue-drawer',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  template: `
    <aside
      class="queue-drawer"
      [class.open]="isOpen()"
      role="dialog"
      aria-label="Playback Queue"
      [attr.aria-hidden]="!isOpen()">
      <!-- Drawer Header -->
      <div class="drawer-header">
        <div class="drawer-title-group">
          <h2>Play Queue</h2>
          <span class="queue-count">{{ player.queue().length }} tracks</span>
        </div>

        <div class="drawer-actions">
          <button
            type="button"
            class="clear-btn"
            (click)="player.clearQueue()"
            [disabled]="player.queue().length === 0"
            title="Clear all tracks from queue"
            aria-label="Clear Queue">
            Clear
          </button>

          <button
            type="button"
            class="close-btn"
            (click)="close.emit()"
            title="Close queue (Esc)"
            aria-label="Close queue">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Drawer Content -->
      <div class="drawer-content">
        @if (player.queue().length === 0) {
          <div class="empty-queue">
            <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" fill="none" stroke-width="1.5" class="empty-icon">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <p class="empty-text">Queue is empty</p>
            <span class="empty-subtext">Double click any song or album to start listening.</span>
          </div>
        } @else {
          <div class="queue-list" role="list">
            @for (entry of player.queue(); track entry.id; let i = $index) {
              <div
                class="queue-item"
                [class.current]="player.currentIndex() === i"
                [class.unavailable]="!entry.track.isAvailable"
                (click)="player.jumpToQueueIndex(i)"
                role="listitem"
                tabindex="0"
                (keydown.enter)="player.jumpToQueueIndex(i)">
                <!-- Index or Playing Indicator -->
                <div class="queue-item-index">
                  @if (player.currentIndex() === i) {
                    <div class="playing-indicator" title="Current track">
                      @if (player.isPlaying()) {
                        <span class="bar bar-1"></span>
                        <span class="bar bar-2"></span>
                        <span class="bar bar-3"></span>
                      } @else {
                        <span class="pause-dot">❚❚</span>
                      }
                    </div>
                  } @else {
                    <span class="item-num">{{ i + 1 }}</span>
                  }
                </div>

                <!-- Artwork Thumbnail -->
                @if (entry.track.artwork) {
                  <img [src]="entry.track.artwork" [alt]="entry.track.title" class="thumb-img" />
                } @else {
                  <div class="thumb-placeholder" aria-hidden="true">♪</div>
                }

                <!-- Track Info -->
                <div class="queue-item-meta">
                  <span class="track-title truncate" [title]="entry.track.title">
                    {{ entry.track.title }}
                  </span>
                  <span class="track-artist truncate" [title]="entry.track.artist || 'Unknown Artist'">
                    {{ entry.track.artist || 'Unknown Artist' }}
                  </span>
                </div>

                <!-- Duration -->
                <span class="queue-item-duration">
                  {{ entry.track.duration | duration }}
                </span>

                <!-- Remove Button -->
                <button
                  type="button"
                  class="remove-btn"
                  (click)="onRemove($event, entry.id)"
                  title="Remove from queue"
                  aria-label="Remove track from queue">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .queue-drawer {
      position: absolute;
      top: 0;
      right: 0;
      bottom: var(--player-bar-height);
      width: var(--queue-drawer-width);
      background: var(--bg-surface);
      border-left: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-lg);
      transform: translateX(100%);
      transition: transform var(--transition-normal);
      display: flex;
      flex-direction: column;
      z-index: 20;
    }

    .queue-drawer.open {
      transform: translateX(0);
    }

    .drawer-header {
      height: 64px;
      padding: 0 var(--space-4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
      background: var(--bg-elevated);
    }

    .drawer-title-group h2 {
      font-size: var(--font-size-md);
      font-weight: 700;
    }

    .queue-count {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .drawer-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .clear-btn {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      transition: color var(--transition-fast), border-color var(--transition-fast);
    }

    .clear-btn:hover:not(:disabled) {
      color: var(--status-error);
      border-color: var(--status-error);
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .close-btn:hover {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .empty-queue {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--text-muted);
      padding: var(--space-6);
    }

    .empty-icon {
      opacity: 0.4;
      margin-bottom: var(--space-3);
    }

    .empty-text {
      font-weight: 600;
      font-size: var(--font-size-base);
      color: var(--text-secondary);
    }

    .empty-subtext {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
      max-width: 220px;
    }

    .queue-list {
      display: flex;
      flex-direction: column;
      padding: var(--space-2) 0;
    }

    .queue-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .queue-item:hover {
      background: var(--bg-surface-hover);
    }

    .queue-item.current {
      background: var(--accent-muted);
    }

    .queue-item.current .track-title {
      color: var(--accent-primary);
      font-weight: 600;
    }

    .queue-item.unavailable {
      opacity: 0.45;
    }

    .queue-item-index {
      width: 20px;
      text-align: center;
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .thumb-img, .thumb-placeholder {
      width: 36px;
      height: 36px;
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

    .queue-item-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .track-title {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: 500;
    }

    .track-artist {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-top: 1px;
    }

    .queue-item-duration {
      font-size: var(--font-size-xs);
      font-family: var(--font-family-mono);
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .remove-btn {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      opacity: 0;
      transition: opacity var(--transition-fast), color var(--transition-fast);
      flex-shrink: 0;
    }

    .queue-item:hover .remove-btn {
      opacity: 1;
    }

    .remove-btn:hover {
      color: var(--status-error);
      background: rgba(239, 68, 68, 0.15);
    }

    /* Animated equalizer bars */
    .playing-indicator {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 12px;
    }

    .bar {
      width: 2.5px;
      background: var(--accent-primary);
      border-radius: 1px;
      animation: equalize 1s infinite alternate ease-in-out;
    }

    .bar-1 { height: 4px; animation-delay: 0.1s; }
    .bar-2 { height: 12px; animation-delay: 0.3s; }
    .bar-3 { height: 7px; animation-delay: 0.2s; }

    @keyframes equalize {
      0% { height: 3px; }
      100% { height: 12px; }
    }

    .pause-dot {
      font-size: 9px;
      color: var(--accent-primary);
    }
  `]
})
export class QueueDrawerComponent {
  readonly player = inject(PlayerService);
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  onRemove(event: MouseEvent, entryId: string): void {
    event.stopPropagation();
    this.player.removeFromQueue(entryId);
  }
}
