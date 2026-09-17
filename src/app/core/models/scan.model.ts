export interface ScanProgress {
  isScanning: boolean;
  scannedFiles: number;
  audioFiles: number;
  currentPath: string | null;
  error?: string | null;
}
