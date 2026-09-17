import { DesktopApi } from './desktop-api';
import { ElectronLibraryGateway } from './electron-library.gateway';
import { ScanProgress } from '../models';

describe('ElectronLibraryGateway', () => {
  let originalDesktop: DesktopApi | undefined;
  let progressListener: ((value: ScanProgress) => void) | undefined;

  beforeEach(() => {
    originalDesktop = window.desktop;
    const api = {
      runtime: 'electron',
      ping: jasmine.createSpy().and.resolveTo('pong'),
      library: {
        getSnapshot: jasmine.createSpy().and.resolveTo({ tracks: [], albums: [], artists: [], folders: [] }),
        getFolderTree: jasmine.createSpy().and.resolveTo(null),
        selectAndAddFolders: jasmine.createSpy().and.resolveTo([]),
        removeFolder: jasmine.createSpy().and.resolveTo(),
        startScan: jasmine.createSpy().and.resolveTo(),
        onScanProgress: jasmine.createSpy().and.callFake((listener: (value: ScanProgress) => void) => { progressListener = listener; return () => undefined; }),
      },
      playlists: {},
      settings: {},
    } as unknown as DesktopApi;
    Object.defineProperty(window, 'desktop', { configurable: true, value: api });
  });

  afterEach(() => Object.defineProperty(window, 'desktop', { configurable: true, value: originalDesktop }));

  it('maps secure folder and scan operations to the preload API', async () => {
    const gateway = new ElectronLibraryGateway();
    const api = window.desktop!;
    await gateway.selectAndAddMusicFolders();
    await gateway.requestScan(['folder-' + 'a'.repeat(64)]);
    expect(api.library.selectAndAddFolders).toHaveBeenCalled();
    expect(api.library.startScan).toHaveBeenCalledWith(['folder-' + 'a'.repeat(64)]);
  });

  it('forwards scan progress without exposing Electron event objects', () => {
    const gateway = new ElectronLibraryGateway();
    const values: ScanProgress[] = [];
    gateway.scanProgress$.subscribe((value) => values.push(value));
    progressListener?.({ isScanning: true, scannedFiles: 2, audioFiles: 1, currentPath: 'D:\\Music' });
    expect(values.at(-1)?.scannedFiles).toBe(2);
  });
});
