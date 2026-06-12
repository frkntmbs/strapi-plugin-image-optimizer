export const PLUGIN_ID = 'image-optimizer';

export type OptimizationChoice = 'original' | 'global' | 'custom';
export type OptimizationMode = 'webp' | 'compress';

export interface OptimizationSettings {
  mode: OptimizationMode;
  webpQuality: number;
  jpegQuality: number;
  pngCompressionLevel: number;
  maxWidth: number;
  maxHeight: number;
}

export interface AssetOptimizationPreference {
  choice: OptimizationChoice;
  custom?: OptimizationSettings;
}

export interface GlobalOptimizationSettings {
  defaultChoice: OptimizationChoice;
  defaultMode: OptimizationMode;
  webpQuality: number;
  jpegQuality: number;
  pngCompressionLevel: number;
}

export const getTranslationKey = (key: string) => `${PLUGIN_ID}.${key}`;
