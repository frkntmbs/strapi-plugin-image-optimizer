import { AsyncLocalStorage } from 'async_hooks';
import type { OptimizationChoice, OptimizationSettings } from '../constants';

export interface UploadFilePreference {
  assetId?: string;
  fileName: string;
  preference: {
    choice: OptimizationChoice;
    custom?: OptimizationSettings;
  };
}

interface OptimizerUploadContext {
  preferences: UploadFilePreference[];
  nextIndex: number;
}

export const optimizerUploadContext = new AsyncLocalStorage<OptimizerUploadContext>();

let fallbackContext: OptimizerUploadContext | null = null;

export const createUploadContext = (preferences: UploadFilePreference[]): OptimizerUploadContext => ({
  preferences,
  nextIndex: 0,
});

export const setFallbackUploadPreferences = (preferences: UploadFilePreference[]) => {
  fallbackContext = createUploadContext(preferences);
};

export const clearFallbackUploadPreferences = () => {
  fallbackContext = null;
};

const getActivePreferences = () => {
  const store = optimizerUploadContext.getStore();

  if (store?.preferences.length) {
    return store;
  }

  return fallbackContext;
};

export const parseUploadPreferences = (body: Record<string, unknown> | undefined) => {
  const raw = body?.imageOptimizerPreferences;

  if (!raw) {
    return [] as UploadFilePreference[];
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as UploadFilePreference[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(raw) ? (raw as UploadFilePreference[]) : [];
};

export const findUploadPreference = (fileName: string, assetId?: string) => {
  const store = getActivePreferences();

  if (!store) {
    return null;
  }

  const match = store.preferences.find((entry) => {
    if (assetId && entry.assetId === assetId) {
      return true;
    }

    return entry.fileName === fileName;
  });

  return match?.preference ?? null;
};

export const consumeUploadPreference = (fileName: string, assetId?: string) => {
  const store = getActivePreferences();

  if (!store) {
    return null;
  }

  const indexed = store.preferences[store.nextIndex];

  if (indexed) {
    store.nextIndex += 1;
    return indexed.preference;
  }

  return findUploadPreference(fileName, assetId);
};

export const isUploadRoute = (method: string, path: string) => {
  if (method.toUpperCase() !== 'POST') {
    return false;
  }

  const normalizedPath = path.replace(/\/+$/, '') || '/';

  return normalizedPath === '/upload';
};
