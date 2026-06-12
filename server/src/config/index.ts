import type { OptimizationChoice, OptimizationMode } from '../constants';

export interface PluginConfig {
  defaultChoice: OptimizationChoice;
  defaultMode: OptimizationMode;
  webpQuality: number;
  jpegQuality: number;
  pngCompressionLevel: number;
}

export default {
  default: (): PluginConfig => ({
    defaultChoice: 'original',
    defaultMode: 'compress',
    webpQuality: 82,
    jpegQuality: 80,
    pngCompressionLevel: 9,
  }),
  validator(config: Partial<PluginConfig>) {
    if (config.webpQuality !== undefined) {
      if (config.webpQuality < 1 || config.webpQuality > 100) {
        throw new Error('webpQuality must be between 1 and 100');
      }
    }
    if (config.jpegQuality !== undefined) {
      if (config.jpegQuality < 1 || config.jpegQuality > 100) {
        throw new Error('jpegQuality must be between 1 and 100');
      }
    }
    if (config.pngCompressionLevel !== undefined) {
      if (config.pngCompressionLevel < 0 || config.pngCompressionLevel > 9) {
        throw new Error('pngCompressionLevel must be between 0 and 9');
      }
    }
  },
};
