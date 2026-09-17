import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'songs',
    loadComponent: () => import('./features/songs/songs.component').then((m) => m.SongsComponent),
  },
  {
    path: 'albums',
    loadComponent: () => import('./features/albums/albums.component').then((m) => m.AlbumsComponent),
  },
  {
    path: 'albums/:id',
    loadComponent: () => import('./features/albums/album-detail/album-detail.component').then((m) => m.AlbumDetailComponent),
  },
  {
    path: 'artists',
    loadComponent: () => import('./features/artists/artists.component').then((m) => m.ArtistsComponent),
  },
  {
    path: 'artists/:id',
    loadComponent: () => import('./features/artists/artist-detail/artist-detail.component').then((m) => m.ArtistDetailComponent),
  },
  {
    path: 'folders',
    loadComponent: () => import('./features/folders/folders.component').then((m) => m.FoldersComponent),
  },
  {
    path: 'playlists',
    loadComponent: () => import('./features/playlists/playlists.component').then((m) => m.PlaylistsComponent),
  },
  {
    path: 'playlists/:id',
    loadComponent: () => import('./features/playlists/playlist-detail/playlist-detail.component').then((m) => m.PlaylistDetailComponent),
  },
  {
    path: 'now-playing',
    loadComponent: () => import('./features/now-playing/now-playing.component').then((m) => m.NowPlayingComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'home' },
];
