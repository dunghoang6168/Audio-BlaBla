import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { PlayerBarComponent } from './shared/components/player-bar/player-bar.component';
import { QueueDrawerComponent } from './shared/components/queue-drawer/queue-drawer.component';
import { TrackDetailsPanelComponent } from './shared/components/track-details-panel/track-details-panel.component';
import { RightPanelService } from './core/layout/right-panel.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    SidebarComponent,
    PlayerBarComponent,
    QueueDrawerComponent,
    TrackDetailsPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly rightPanels = inject(RightPanelService);
  readonly isQueueOpen = this.rightPanels.isQueueOpen;

  onToggleSidebar(): void {
    this.isSidebarCollapsed.update((val) => !val);
  }

  onToggleQueue(): void {
    this.rightPanels.toggleQueue();
  }

  onCloseQueue(): void {
    this.rightPanels.closeQueue();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.rightPanels.closeActive();
  }
}
