import type { OptimizationMode } from '../pluginId';

export type QualityField = 'webp' | 'jpeg' | 'png';

export const getImageFormatFromName = (name?: string): QualityField | 'other' => {
  const ext = name?.split('.').pop()?.toLowerCase();

  if (ext === 'webp') {
    return 'webp';
  }

  if (ext === 'jpg' || ext === 'jpeg') {
    return 'jpeg';
  }

  if (ext === 'png') {
    return 'png';
  }

  return 'other';
};

export const getQualityFieldsForMode = (
  mode: OptimizationMode,
  assetName?: string
): QualityField[] => {
  if (mode === 'webp') {
    return ['webp'];
  }

  const format = getImageFormatFromName(assetName);

  if (format === 'webp' || format === 'jpeg' || format === 'png') {
    return [format];
  }

  return ['jpeg'];
};
