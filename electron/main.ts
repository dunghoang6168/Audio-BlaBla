import { app, BrowserWindow, Menu, session, type BrowserWindow as BrowserWindowType } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ArtworkService } from './services/artwork.service.js';
import { DatabaseService } from './services/database.service.js';
import { ScannerService } from './services/scanner.service.js';
import { TrackDetailsService } from './services/track-details.service.js';
import { ArtistMetadataService } from './services/artist-metadata.service.js';
import { migrateLegacyProfile } from './services/profile-migration.service.js';
import { broadcastProgress, registerIpc } from './ipc/register-ipc.js';
import { installProtocolHandlers, registerPrivilegedSchemes } from './protocols/register-protocols.js';

registerPrivilegedSchemes();

const development = process.argv.includes('--dev');
const smokeTest = process.argv.includes('--smoke');
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindowType | null = null;
let database: DatabaseService | null = null;

if (smokeTest) {
  const smokeUserData = process.env['AUDIO_LUTSTRA_SMOKE_USER_DATA'];
  if (!smokeUserData) throw new Error('Smoke test userData path was not provided by the launcher');
  app.setPath('userData', smokeUserData);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    name: 'audio-lutstra-main',
    windowStatePersistence: true,
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: !smokeTest,
    backgroundColor: '#09090b',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#00000000', symbolColor: '#f9fafb', height: 64 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, target) => {
    const allowed = target.startsWith('app://audio-lutstra/') || (development && target.startsWith('http://localhost:4200/'));
    if (!allowed) event.preventDefault();
  });
  mainWindow.on('closed', () => { mainWindow = null; });

  if (development) void mainWindow.loadURL('http://localhost:4200/');
  else void mainWindow.loadURL('app://audio-lutstra/index.html');

  if (smokeTest) {
    mainWindow.webContents.once('did-finish-load', () => {
      const timeout = setTimeout(() => {
        console.error('[smoke] Timed out waiting for renderer IPC');
        app.exit(1);
      }, 5000);
      mainWindow?.webContents.on('page-title-updated', (_event, title) => {
        if (!title.startsWith('smoke:')) return;
        clearTimeout(timeout);
        const [pong, trackCount] = title.slice(6).split(':');
        if (pong !== 'pong') {
          console.error('[smoke] IPC ping did not return pong');
          app.exit(1);
          return;
        }
        console.info('[smoke]', { pong, trackCount: Number(trackCount) });
        app.quit();
      });
      void mainWindow?.webContents.executeJavaScript(`Promise.all([
        window.desktop.ping(),
        window.desktop.library.getSnapshot(),
      ]).then(([pong, snapshot]) => { document.title = 'smoke:' + pong + ':' + snapshot.tracks.length; })`);
    });
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  const userData = app.getPath('userData');
  if (!smokeTest) {
    const migratedFrom = await migrateLegacyProfile(userData, app.getPath('appData'));
    if (migratedFrom) console.info('[profile] Migrated legacy library from', migratedFrom);
  }
  database = new DatabaseService(path.join(userData, 'audio-lutstra.sqlite'));
  const artwork = new ArtworkService(path.join(userData, 'artwork-cache'), database);
  const scanner = new ScannerService(database, artwork, (progress) => broadcastProgress(mainWindow, progress));
  const trackDetails = new TrackDetailsService(database);
  const artistMetadata = new ArtistMetadataService(database, artwork, (update) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('artist-metadata:updated', update);
  });
  const rendererRoot = path.join(app.getAppPath(), 'dist', 'audio-lutstra', 'browser');

  installProtocolHandlers(database, rendererRoot, development);
  registerIpc(database, scanner, trackDetails, artistMetadata, () => mainWindow, development);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  createWindow();

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch((error) => {
  console.error('[bootstrap]', error);
  app.quit();
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { database?.close(); database = null; });
