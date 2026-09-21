import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <!-- Brand Logo -->
      <div class="brand">
        <div class="logo-icon" aria-hidden="true">
          <app-icon name="headphones" [size]="20" />
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
          <app-icon name="home" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Home</span> }
        </a>

        <a routerLink="/songs" routerLinkActive="active" class="nav-item" title="Songs">
          <app-icon name="music" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Songs</span> }
        </a>

        <a routerLink="/albums" routerLinkActive="active" class="nav-item" title="Albums">
          <app-icon name="disc" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Albums</span> }
        </a>

        <a routerLink="/artists" routerLinkActive="active" class="nav-item" title="Artists">
          <app-icon name="user" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Artists</span> }
        </a>

        <a routerLink="/folders" routerLinkActive="active" class="nav-item" title="Folders">
          <app-icon name="folder" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Folders</span> }
        </a>

        <a routerLink="/playlists" routerLinkActive="active" class="nav-item" title="Playlists">
          <app-icon name="list-music" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Playlists</span> }
        </a>
      </nav>

      <!-- Bottom Settings Link & Collapse toggle -->
      <div class="sidebar-footer">
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" title="Settings">
          <app-icon name="settings" [size]="18" class="nav-icon" />
          @if (!isCollapsed()) { <span class="nav-label">Settings</span> }
        </a>

        <button type="button" class="collapse-btn" (click)="toggleCollapse.emit()" [title]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'" [attr.aria-label]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <app-icon [name]="isCollapsed() ? 'chevron-right' : 'chevron-left'" [size]="16" />
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100%;
      background: var(--color-navigation);
      border-right: 1px solid var(--color-border-subtle);
      display: flex;
      flex-direction: column;
      transition:
        width var(--transition-normal),
        background-color var(--transition-normal),
        border-color var(--transition-normal),
        color var(--transition-normal);
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
