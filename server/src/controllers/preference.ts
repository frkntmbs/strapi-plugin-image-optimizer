import type { Core } from '@strapi/strapi';
import {
  OPTIMIZATION_CHOICES,
  OPTIMIZATION_MODES,
  type OptimizationChoice,
  type OptimizationMode,
  type OptimizationSettings,
} from '../constants';

const isValidChoice = (choice: unknown): choice is OptimizationChoice =>
  typeof choice === 'string' && OPTIMIZATION_CHOICES.includes(choice as OptimizationChoice);

const isValidMode = (mode: unknown): mode is OptimizationMode =>
  typeof mode === 'string' && OPTIMIZATION_MODES.includes(mode as OptimizationMode);

const isValidCustomSettings = (custom: unknown): custom is OptimizationSettings => {
  if (!custom || typeof custom !== 'object') {
    return false;
  }

  const value = custom as Partial<OptimizationSettings>;

  return (
    isValidMode(value.mode) &&
    typeof value.webpQuality === 'number' &&
    value.webpQuality >= 1 &&
    value.webpQuality <= 100 &&
    typeof value.jpegQuality === 'number' &&
    value.jpegQuality >= 1 &&
    value.jpegQuality <= 100 &&
    typeof value.pngCompressionLevel === 'number' &&
    value.pngCompressionLevel >= 0 &&
    value.pngCompressionLevel <= 9 &&
    typeof value.maxWidth === 'number' &&
    value.maxWidth >= 1 &&
    typeof value.maxHeight === 'number' &&
    value.maxHeight >= 1
  );
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getDefaultMode(ctx) {
    const settings = await strapi.plugin('image-optimizer').service('preference').getGlobalSettings();
    ctx.body = {
      defaultChoice: settings.defaultChoice,
      defaultMode: settings.defaultMode,
      webpQuality: settings.webpQuality,
      jpegQuality: settings.jpegQuality,
      pngCompressionLevel: settings.pngCompressionLevel,
    };
  },

  async getPreference(ctx) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized();
    }

    const preferenceService = strapi.plugin('image-optimizer').service('preference');
    const mode = await preferenceService.getUserPreference(userId);
    const settings = await preferenceService.getGlobalSettings();

    ctx.body = {
      mode: mode ?? settings.defaultMode,
      defaultMode: settings.defaultMode,
      defaultChoice: settings.defaultChoice,
    };
  },

  async updatePreference(ctx) {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return ctx.unauthorized();
    }

    const { mode } = ctx.request.body ?? {};

    if (!isValidMode(mode)) {
      return ctx.badRequest('Invalid optimization mode');
    }

    await strapi.plugin('image-optimizer').service('preference').setUserPreference(userId, mode);

    ctx.body = { mode };
  },

  async getSettings(ctx) {
    const settings = await strapi.plugin('image-optimizer').service('preference').getGlobalSettings();
    ctx.body = settings;
  },

  async updateSettings(ctx) {
    const { webpQuality, jpegQuality, pngCompressionLevel, defaultMode, defaultChoice } =
      ctx.request.body ?? {};

    if (defaultMode !== undefined && !isValidMode(defaultMode)) {
      return ctx.badRequest('Invalid default mode');
    }

    if (defaultChoice !== undefined && !isValidChoice(defaultChoice)) {
      return ctx.badRequest('Invalid default choice');
    }

    if (webpQuality !== undefined && (webpQuality < 1 || webpQuality > 100)) {
      return ctx.badRequest('Invalid WebP quality');
    }

    if (jpegQuality !== undefined && (jpegQuality < 1 || jpegQuality > 100)) {
      return ctx.badRequest('Invalid JPEG quality');
    }

    if (pngCompressionLevel !== undefined && (pngCompressionLevel < 0 || pngCompressionLevel > 9)) {
      return ctx.badRequest('Invalid PNG compression level');
    }

    const payload: Record<string, unknown> = {};

    if (webpQuality !== undefined) payload.webpQuality = Number(webpQuality);
    if (jpegQuality !== undefined) payload.jpegQuality = Number(jpegQuality);
    if (pngCompressionLevel !== undefined) payload.pngCompressionLevel = Number(pngCompressionLevel);
    if (defaultMode !== undefined) payload.defaultMode = defaultMode;
    if (defaultChoice !== undefined) payload.defaultChoice = defaultChoice;

    await strapi.plugin('image-optimizer').service('preference').setGlobalSettings(payload);

    const settings = await strapi.plugin('image-optimizer').service('preference').getGlobalSettings();
    ctx.body = settings;
  },
});
