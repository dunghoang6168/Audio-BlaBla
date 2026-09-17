import { Component } from '@angular/core';
import { getDesktopApi } from '../../../core/desktop/desktop-api';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  template: `
    <div class="demo-banner" role="status" [attr.aria-label]="isDesktop ? 'Desktop mode indicator' : 'Demo mode indicator'">
      <span class="badge">{{ isDesktop ? 'DESKTOP MODE' : 'DEMO MODE' }}</span>
      <span class="message">
        {{ isDesktop ? 'Local library, persistence and playback are connected.' : 'Audio playback, library scanning and persistence are simulated in-memory.' }}
      </span>
    </div>
  `,
  styles: [`
    .demo-banner {
      height: var(--demo-banner-height);
      background: linear-gradient(90deg, #2e1065, #1e1b4b);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      user-select: none;
    }
    .badge {
      background: var(--accent-primary);
      color: var(--text-primary);
      font-weight: 700;
      padding: 1px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    .message {
      color: var(--text-muted);
    }
  `]
})
export class DemoBannerComponent { readonly isDesktop = Boolean(getDesktopApi()); }
