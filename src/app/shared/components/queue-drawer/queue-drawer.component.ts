import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../../core/player/player.service';
import { QueueEntry } from '../../../core/models';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-queue-drawer',
  standalone: true,
  imports: [CommonModule, DurationPipe, IconComponent],
  templateUrl: './queue-drawer.component.html',
  styleUrl: './queue-drawer.component.scss'
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
