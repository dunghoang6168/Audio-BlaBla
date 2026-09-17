import { DesktopApi } from './app/core/desktop/desktop-api';

declare global {
  interface Window {
    desktop?: DesktopApi;
  }
}

export {};
