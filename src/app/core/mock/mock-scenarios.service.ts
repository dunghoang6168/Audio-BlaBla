import { Injectable, inject } from '@angular/core';
import { LIBRARY_GATEWAY } from '../contracts';
import { MockLibraryGateway } from './mock-library.gateway';

@Injectable({ providedIn: 'root' })
export class MockScenariosService {
  private readonly libraryGateway = inject(LIBRARY_GATEWAY) as MockLibraryGateway;

  /**
   * Trigger a simulated scan with partial corrupted file warnings.
   */
  async triggerScanWithWarning(): Promise<void> {
    await this.libraryGateway.requestScan();
  }
}
