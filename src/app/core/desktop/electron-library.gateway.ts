import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LibraryGateway, LibrarySnapshot } from '../contracts/library.gateway';
import { FolderNode, MusicFolder, ScanProgress, TrackDetails } from '../models';
import { getDesktopApi } from './desktop-api';

@Injectable()
export class ElectronLibraryGateway implements LibraryGateway {
  private readonly api = getDesktopApi();
  private readonly progress = new BehaviorSubject<ScanProgress>({ isScanning: false, scannedFiles: 0, audioFiles: 0, currentPath: null });
  readonly scanProgress$ = this.progress.asObservable();

  constructor() {
    this.requireApi().library.onScanProgress((value) => this.progress.next(value));
  }
  getLibrary(): Promise<LibrarySnapshot> { return this.requireApi().library.getSnapshot(); }
  getFolderTree(folderId: string): Promise<FolderNode | null> { return this.requireApi().library.getFolderTree(folderId); }
  getTrackDetails(trackId: string): Promise<TrackDetails> { return this.requireApi().library.getTrackDetails(trackId); }
  selectAndAddMusicFolders(): Promise<MusicFolder[]> { return this.requireApi().library.selectAndAddFolders(); }
  removeMusicFolder(folderId: string): Promise<void> { return this.requireApi().library.removeFolder(folderId); }
  requestScan(folderIds?: string[]): Promise<void> { return this.requireApi().library.startScan(folderIds); }

  private requireApi() {
    if (!this.api) throw new Error('Electron desktop API is unavailable');
    return this.api;
  }
}
