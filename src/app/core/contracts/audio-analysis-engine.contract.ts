import { InjectionToken } from '@angular/core';

export interface AudioAnalysisEngine {
  readonly isAnalysisSupported: boolean;

  prepareFrequencyAnalysis(): Promise<number>;
  readFrequencyData(target: Uint8Array<ArrayBuffer>): boolean;
}

export const AUDIO_ANALYSIS_ENGINE = new InjectionToken<AudioAnalysisEngine>('AUDIO_ANALYSIS_ENGINE');
