import { Component, OnInit, inject } from '@angular/core';
import { SongColumn } from '../../core/models';
import { SongColumnPreferencesService } from '../../core/settings/song-column-preferences.service';

@Component({
  selector: 'app-song-columns-settings',
  standalone: true,
  templateUrl: './song-columns-settings.component.html',
  styleUrl: './song-columns-settings.component.scss',
})
export class SongColumnsSettingsComponent implements OnInit {
  readonly preferences = inject(SongColumnPreferencesService);
  readonly songColumnOptions: { id: SongColumn; label: string; description: string }[] = [
    { id: 'index', label: 'Track number', description: 'Position in the current list' },
    { id: 'artist', label: 'Artist', description: 'Track artist' },
    { id: 'album', label: 'Album', description: 'Album name' },
    { id: 'duration', label: 'Time', description: 'Track duration' },
    { id: 'codec', label: 'Codec', description: 'Audio format' },
    { id: 'sampleRate', label: 'Sample Rate', description: 'Sample rate and bit depth' },
    { id: 'actions', label: 'Actions', description: 'Play Next and Add to Queue' },
  ];
  readonly hiddenSongColumns = this.preferences.hiddenSongColumns;
  readonly isLoading = this.preferences.isLoading;
  readonly errorMessage = this.preferences.errorMessage;

  ngOnInit(): Promise<void> { return this.preferences.load(); }
  isSongColumnVisible(column: SongColumn): boolean { return !this.preferences.isHidden(column); }
  onSongColumnChange(column: SongColumn, visible: boolean): Promise<void> {
    return this.preferences.setVisible(column, visible);
  }
}
