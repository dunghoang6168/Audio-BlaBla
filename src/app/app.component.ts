import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DemoBannerComponent } from './shared/components/demo-banner/demo-banner.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { PlayerBarComponent } from './shared/components/player-bar/player-bar.component';
import { QueueDrawerComponent } from './shared/components/queue-drawer/queue-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DemoBannerComponent,
    SidebarComponent,
    PlayerBarComponent,
    QueueDrawerComponent,
  ],
  template: `
    <div class="app-layout">
      <!-- Top Demo Banner -->
      <app-demo-banner />

      <!-- Main Workspace (Sidebar + Router Content + Queue Drawer) -->
      <div class="workspace">
        <app-sidebar
          [isCollapsed]="isSidebarCollapsed()"
          (toggleCollapse)="onToggleSidebar()"
        />

        <main class="main-content" role="main">
          <router-outlet />
        </main>

        <app-queue-drawer
          [isOpen]="isQueueOpen()"
          (close)="onCloseQueue()"
        />
      </div>

      <!-- Fixed Bottom Player Bar -->
      <app-player-bar
        [isQueueOpen]="isQueueOpen()"
        (toggleQueue)="onToggleQueue()"
      />
    </div>
  `,
  styles: [`
    .app-layout {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .workspace {
      flex: 1;
      display: flex;
      position: relative;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      height: 100%;
      overflow: hidden;
      background: var(--bg-app);
      position: relative;
    }
  `]
})
export class AppComponent {
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly isQueueOpen = signal<boolean>(false);

  onToggleSidebar(): void {
    this.isSidebarCollapsed.update((val) => !val);
  }

  onToggleQueue(): void {
    this.isQueueOpen.update((val) => !val);
  }

  onCloseQueue(): void {
    this.isQueueOpen.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isQueueOpen()) {
      this.onCloseQueue();
    }
  }
}
