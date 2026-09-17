import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <!-- Brand Logo -->
      <div class="brand">
        <div class="logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
        </div>
        @if (!isCollapsed()) {
          <div class="brand-text">
            <span class="title">Audio BlaBla</span>
            <span class="tag">Hi-Res Player</span>
          </div>
        }
      </div>

      <!-- Navigation Links -->
      <nav class="nav-menu" aria-label="Main Navigation">
        <div class="nav-section-title">LIBRARY</div>

        <a routerLink="/home" routerLinkActive="active" class="nav-item" title="Home">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Home</span> }
        </a>

        <a routerLink="/songs" routerLinkActive="active" class="nav-item" title="Songs">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Songs</span> }
        </a>

        <a routerLink="/albums" routerLinkActive="active" class="nav-item" title="Albums">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Albums</span> }
        </a>

        <a routerLink="/artists" routerLinkActive="active" class="nav-item" title="Artists">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Artists</span> }
        </a>

        <a routerLink="/folders" routerLinkActive="active" class="nav-item" title="Folders">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Folders</span> }
        </a>

        <a routerLink="/playlists" routerLinkActive="active" class="nav-item" title="Playlists">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="21" x2="3" y1="6" y2="6"></line>
            <line x1="15" x2="3" y1="12" y2="12"></line>
            <line x1="17" x2="3" y1="18" y2="18"></line>
            <path d="m19 10 3 3-3 3"></path>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Playlists</span> }
        </a>
      </nav>

      <!-- Bottom Settings Link & Collapse toggle -->
      <div class="sidebar-footer">
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" title="Settings">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          @if (!isCollapsed()) { <span class="nav-label">Settings</span> }
        </a>

        <button type="button" class="collapse-btn" (click)="toggleCollapse.emit()" [title]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            @if (isCollapsed()) {
              <polyline points="9 18 15 12 9 6"></polyline>
            } @else {
              <polyline points="15 18 9 12 15 6"></polyline>
            }
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100%;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-normal);
      flex-shrink: 0;
      user-select: none;
    }

    .sidebar.collapsed {
      width: var(--sidebar-collapsed-width);
    }

    .brand {
      height: 64px;
      padding: 0 var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      border-bottom: 1px solid var(--border-subtle);
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-active));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px var(--accent-glow);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .brand-text .title {
      font-weight: 700;
      font-size: var(--font-size-md);
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .brand-text .tag {
      font-size: 11px;
      color: var(--accent-primary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-menu {
      flex: 1;
      padding: var(--space-4) var(--space-2);
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-1);
    }

    .sidebar.collapsed .nav-section-title {
      display: none;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--font-size-base);
      font-weight: 500;
      transition: background var(--transition-fast), color var(--transition-fast);
      white-space: nowrap;
    }

    .nav-item:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--accent-muted);
      color: var(--accent-primary);
      font-weight: 600;
    }

    .nav-icon {
      flex-shrink: 0;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: var(--space-3);
    }

    .sidebar-footer {
      padding: var(--space-3) var(--space-2);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .sidebar-footer .nav-item {
      flex: 1;
    }

    .collapse-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      flex-shrink: 0;
      transition: color var(--transition-fast), background var(--transition-fast);
    }

    .collapse-btn:hover {
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .sidebar.collapsed .sidebar-footer {
      flex-direction: column;
    }
  `]
})
export class SidebarComponent {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();
}
