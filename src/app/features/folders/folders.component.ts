import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LIBRARY_GATEWAY } from '../../core/contracts';
import { FolderNode, MusicFolder, ScanProgress, Track } from '../../core/models';
import { PlayerService } from '../../core/player/player.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-folders',
  standalone: true,
  imports: [CommonModule, FormsModule, DurationPipe, IconComponent],
  templateUrl: './folders.component.html',
  styleUrl: './folders.component.scss'
})
export class FoldersComponent implements OnInit, OnDestroy {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY);
  readonly player = inject(PlayerService);
  private readonly sub = new Subscription();

  readonly roots = signal<MusicFolder[]>([]);
  readonly selectedRootId = signal<string | null>(null);
  readonly nodeStack = signal<FolderNode[]>([]);
  readonly allTracks = signal<Track[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Scan State
  readonly scanProgress = signal<ScanProgress>({
    isScanning: false,
    scannedFiles: 0,
    audioFiles: 0,
    currentPath: null,
  });

  // Modal Dialogs
  readonly showRemoveDialog = signal<boolean>(false);

  selectedRoot = () => this.roots().find((r) => r.id === this.selectedRootId()) || null;
  currentNode = () => {
    const stack = this.nodeStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  };
  subfolders = () => {
    const curr = this.currentNode();
    return curr?.children?.filter((c) => c.isFolder) || [];
  };
  readonly filesInCurrentFolder = computed(() => {
    const curr = this.currentNode();
    return (curr?.children?.filter((child) => !child.isFolder) ?? [])
      .sort(compareFolderFiles);
  });

  async ngOnInit(): Promise<void> {
    let wasScanning = false;
    this.sub.add(
      this.libraryGateway.scanProgress$.subscribe(async (prog) => {
        const justFinished = wasScanning && !prog.isScanning;
        wasScanning = prog.isScanning;
        this.scanProgress.set(prog);

        if (justFinished) {
          await this.loadRoots();
        }
      })
    );

    await this.loadRoots();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async loadRoots(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const lib = await this.libraryGateway.getLibrary();
      this.roots.set(lib.folders);
      this.allTracks.set(lib.tracks);

      if (lib.folders.length > 0) {
        const rootToSelect = this.selectedRootId()
          ? lib.folders.find((f) => f.id === this.selectedRootId()) || lib.folders[0]
          : lib.folders[0];
        await this.onSelectRoot(rootToSelect);
      } else {
        this.nodeStack.set([]);
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to load music folders');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSelectRoot(root: MusicFolder): Promise<void> {
    this.selectedRootId.set(root.id);
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const tree = await this.libraryGateway.getFolderTree(root.id);
      if (tree) {
        this.nodeStack.set([tree]);
      } else {
        this.nodeStack.set([]);
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || `Failed to load folder tree for ${root.name}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  onEnterFolder(node: FolderNode): void {
    this.nodeStack.update((stack) => [...stack, node]);
  }

  onNavigateBreadcrumb(index: number): void {
    this.nodeStack.update((stack) => stack.slice(0, index + 1));
  }

  async onStartScan(): Promise<void> {
    const root = this.selectedRoot();
    this.errorMessage.set(null);
    try {
      await this.libraryGateway.requestScan(root ? [root.id] : undefined);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to request scan');
    }
  }

  async onAddFolder(): Promise<void> {
    this.errorMessage.set(null);
    try {
      const selected = await this.libraryGateway.selectAndAddMusicFolders();
      if (selected && selected.length > 0) {
        await this.loadRoots();
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to select or add folder');
    }
  }

  async onConfirmRemoveRoot(): Promise<void> {
    const rootId = this.selectedRootId();
    if (!rootId) return;

    try {
      await this.libraryGateway.removeMusicFolder(rootId);
      this.showRemoveDialog.set(false);
      this.selectedRootId.set(null);
      await this.loadRoots();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Failed to remove folder');
    }
  }

  onPlayFile(fileNode: FolderNode): void {
    if (!fileNode.trackId) return;
    const track = this.allTracks().find((t) => t.id === fileNode.trackId);
    if (track && track.isAvailable) {
      this.player.playTrack(track);
    }
  }

  onPlayFolderFiles(): void {
    const files = this.filesInCurrentFolder();
    const trackMap = new Map<string, Track>();
    this.allTracks().forEach((t) => trackMap.set(t.id, t));

    const tracks: Track[] = [];
    files.forEach((f) => {
      if (f.trackId) {
        const t = trackMap.get(f.trackId);
        if (t) tracks.push(t);
      }
    });

    if (tracks.length > 0) {
      this.player.playCollection(tracks, 0);
    }
  }

  getTrackDuration(trackId?: string | null): number {
    if (!trackId) return 0;
    const t = this.allTracks().find((track) => track.id === trackId);
    return t ? t.duration : 0;
  }
}

const fileNameCollator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

function compareFolderFiles(a: FolderNode, b: FolderNode): number {
  return fileNameCollator.compare(a.name, b.name)
    || fileNameCollator.compare(a.path, b.path)
    || a.id.localeCompare(b.id);
}
