import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDesktopApi } from '../../../core/desktop/desktop-api';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="demo-banner" role="status" [attr.aria-label]="isDesktop ? 'Desktop mode indicator' : 'Demo mode indicator'">
      <div class="banner-content">
        <app-icon [name]="isDesktop ? 'sparkles' : 'info'" [size]="13" class="banner-icon" />
        <span class="badge">{{ isDesktop ? 'DESKTOP MODE' : 'DEMO MODE' }}</span>
        <span class="message">
          {{ isDesktop ? 'Local library, persistence and playback are connected.' : 'Audio playback, library scanning and persistence are simulated in-memory.' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .demo-banner {
      height: var(--demo-banner-height);
      background-color: var(--color-surface-elevated);
      border-bottom: 1px solid var(--color-border-subtle);
      transition: background-color var(--transition-normal), border-color var(--transition-normal), color var(--transition-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      user-select: none;
      padding: 0 var(--space-4);
    }
    .banner-content {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .banner-icon {
      color: var(--color-accent);
      flex-shrink: 0;
      display: inline-flex;
    }
    .badge {
      background: var(--color-accent-muted);
      color: var(--color-text-accent);
      border: 1px solid var(--color-accent-glow);
      font-weight: 700;
      padding: 1px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: 10px;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }
    .message {
      color: var(--color-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class DemoBannerComponent { readonly isDesktop = Boolean(getDesktopApi()); }
