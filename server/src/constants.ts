export const PLUGIN_ID = 'image-optimizer';

export type OptimizationChoice = 'original' | 'global' | 'custom';
export type OptimizationMode = 'webp' | 'compress';

export const OPTIMIZATION_CHOICES: OptimizationChoice[] = ['original', 'global', 'custom'];
export const OPTIMIZATION_MODES: OptimizationMode[] = ['webp', 'compress'];

export interface OptimizationSettings {
  mode: OptimizationMode;
  webpQuality: number;
  jpegQuality: number;
  pngCompressionLevel: number;
  maxWidth: number;
  maxHeight: number;
}

export interface ResolvedOptimization {
  skip: boolean;
  mode?: OptimizationMode;
  settings?: OptimizationSettings;
}
