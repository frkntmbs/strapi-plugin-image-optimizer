import type { Core } from '@strapi/strapi';
import {
  PLUGIN_ID,
  OPTIMIZATION_CHOICES,
  OPTIMIZATION_MODES,
  type OptimizationChoice,
  type OptimizationMode,
  type OptimizationSettings,
  type ResolvedOptimization,
} from '../constants';
import type { PluginConfig } from '../config';

const GLOBAL_SETTINGS_KEY = 'global-settings';

const userPreferenceKey = (userId: number) => `user-pref-${userId}`;

const isValidChoice = (choice: unknown): choice is OptimizationChoice =>
  typeof choice === 'string' && OPTIMIZATION_CHOICES.includes(choice as OptimizationChoice);

const isValidMode = (mode: unknown): mode is OptimizationMode =>
  typeof mode === 'string' && OPTIMIZATION_MODES.includes(mode as OptimizationMode);

const normalizeLegacyMode = (mode: unknown): OptimizationMode | 'none' | null => {
  if (mode === 'none') {
    return 'none';
  }
  return isValidMode(mode) ? mode : null;
};

const buildSettings = (
  mode: OptimizationMode,
  source: Partial<OptimizationSettings> | PluginConfig
): OptimizationSettings => ({
  mode,
  webpQuality: source.webpQuality ?? 82,
  jpegQuality: source.jpegQuality ?? 80,
  pngCompressionLevel: source.pngCompressionLevel ?? 9,
  maxWidth: source.maxWidth ?? 0,
  maxHeight: source.maxHeight ?? 0,
});

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getUserPreference(userId: number): Promise<OptimizationMode | null> {
    const stored = await strapi.store({
      type: 'plugin',
      name: PLUGIN_ID,
      key: userPreferenceKey(userId),
    }).get<{ mode?: OptimizationMode }>();

    if (stored?.mode && isValidMode(stored.mode)) {
      return stored.mode;
    }

    return null;
  },

  async setUserPreference(userId: number, mode: OptimizationMode) {
    await strapi.store({
      type: 'plugin',
      name: PLUGIN_ID,
      key: userPreferenceKey(userId),
    }).set({ value: { mode } });
  },

  async getGlobalSettings(): Promise<PluginConfig> {
    const configDefaults = strapi.plugin(PLUGIN_ID).config as PluginConfig;
    const stored = await strapi.store({
      type: 'plugin',
      name: PLUGIN_ID,
      key: GLOBAL_SETTINGS_KEY,
    }).get<Partial<PluginConfig>>();

    const merged = {
      ...configDefaults,
      ...(stored ?? {}),
    };

    if (merged.defaultMode === ('none' as OptimizationMode)) {
      merged.defaultMode = 'webp';
    }

    if (!isValidChoice(merged.defaultChoice)) {
      merged.defaultChoice = configDefaults.defaultChoice;
    }

    if (!isValidMode(merged.defaultMode)) {
      merged.defaultMode = configDefaults.defaultMode;
    }

    return merged;
  },

  async setGlobalSettings(settings: Partial<PluginConfig>) {
    const current = await this.getGlobalSettings();
    const next = { ...current, ...settings };

    await strapi.store({
      type: 'plugin',
      name: PLUGIN_ID,
      key: GLOBAL_SETTINGS_KEY,
    }).set({ value: next });
  },

  async resolveOptimization(file: {
    optimizationChoice?: OptimizationChoice;
    optimizationCustom?: Partial<OptimizationSettings>;
    optimizationMode?: string;
  }): Promise<ResolvedOptimization> {
    const global = await this.getGlobalSettings();

    if (!file.optimizationChoice && file.optimizationMode) {
      const legacyMode = normalizeLegacyMode(file.optimizationMode);

      if (legacyMode === 'none') {
        return { skip: true };
      }

      if (legacyMode) {
        return {
          skip: false,
          mode: legacyMode,
          settings: buildSettings(legacyMode, global),
        };
      }
    }

    const choice = isValidChoice(file.optimizationChoice)
      ? file.optimizationChoice
      : global.defaultChoice;

    if (choice === 'original') {
      return { skip: true };
    }

    if (choice === 'global') {
      return {
        skip: false,
        mode: global.defaultMode,
        settings: buildSettings(global.defaultMode, global),
      };
    }

    const custom = file.optimizationCustom ?? {};
    const mode = isValidMode(custom.mode) ? custom.mode : global.defaultMode;

    return {
      skip: false,
      mode,
      settings: buildSettings(mode, {
        mode,
        webpQuality: custom.webpQuality ?? global.webpQuality,
        jpegQuality: custom.jpegQuality ?? global.jpegQuality,
        pngCompressionLevel: custom.pngCompressionLevel ?? global.pngCompressionLevel,
        maxWidth: custom.maxWidth ?? 0,
        maxHeight: custom.maxHeight ?? 0,
      }),
    };
  },
});
