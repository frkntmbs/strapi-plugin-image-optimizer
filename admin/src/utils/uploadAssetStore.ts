import type {
  AssetOptimizationPreference,
  GlobalOptimizationSettings,
  OptimizationChoice,
  OptimizationSettings,
} from '../pluginId';

export interface UploadAssetEntry {
  assetId: string;
  assetName: string;
  width?: number;
  height?: number;
  actionsContainer: HTMLElement;
  footerHost?: HTMLElement;
}

const DEFAULT_GLOBAL_SETTINGS: GlobalOptimizationSettings = {
  defaultChoice: 'original',
  defaultMode: 'compress',
  webpQuality: 82,
  jpegQuality: 80,
  pngCompressionLevel: 9,
};

let globalSettings: GlobalOptimizationSettings = { ...DEFAULT_GLOBAL_SETTINGS };
const assetPreferencesById = new Map<string, AssetOptimizationPreference>();
const assetNamesById = new Map<string, string>();
const assetDimensionsById = new Map<string, { width: number; height: number }>();
const assetPreferencesByFileKey = new Map<string, AssetOptimizationPreference>();

let cards: UploadAssetEntry[] = [];
let cardsSnapshot: UploadAssetEntry[] = [];
let listeners = new Set<() => void>();
let dialogElement: HTMLElement | null = null;
let editingAssetId: string | null = null;
let draftPreference: AssetOptimizationPreference | null = null;

const STABLE_EMPTY_DRAFT: AssetOptimizationPreference = Object.freeze({
  choice: 'original',
  custom: undefined,
});

let fetchPatched = false;

export const buildFileKey = (name: string, size: number, lastModified: number) =>
  `${name}::${size}::${lastModified}`;

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeUploadAssets = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getUploadAssetCards = () => cardsSnapshot;

export const getGlobalSettings = () => globalSettings;

export const setGlobalSettings = (settings: GlobalOptimizationSettings) => {
  globalSettings = settings;
  notify();
};

export const createCustomFromGlobal = (): OptimizationSettings => ({
  mode: globalSettings.defaultMode,
  webpQuality: globalSettings.webpQuality,
  jpegQuality: globalSettings.jpegQuality,
  pngCompressionLevel: globalSettings.pngCompressionLevel,
  maxWidth: 0,
  maxHeight: 0,
});

export const createCustomForAsset = (assetId: string): OptimizationSettings => {
  const dimensions = assetDimensionsById.get(assetId);
  const base = createCustomFromGlobal();

  return {
    ...base,
    maxWidth: dimensions?.width ?? base.maxWidth,
    maxHeight: dimensions?.height ?? base.maxHeight,
  };
};

export const getAssetDimensions = (assetId: string) => assetDimensionsById.get(assetId);

export const createDefaultPreference = (): AssetOptimizationPreference => {
  const choice = globalSettings.defaultChoice;

  return {
    choice,
    custom: choice === 'custom' ? createCustomFromGlobal() : undefined,
  };
};

export const getAssetPreference = (assetId: string): AssetOptimizationPreference => {
  return assetPreferencesById.get(assetId) ?? createDefaultPreference();
};

export const setAssetPreference = (assetId: string, preference: AssetOptimizationPreference) => {
  assetPreferencesById.set(assetId, preference);
  notify();
};

export const registerAsset = (
  assetId: string,
  assetName: string,
  dimensions?: { width: number; height: number }
) => {
  if (!assetPreferencesById.has(assetId)) {
    assetPreferencesById.set(assetId, createDefaultPreference());
  }

  assetNamesById.set(assetId, assetName);

  if (dimensions?.width && dimensions?.height) {
    assetDimensionsById.set(assetId, dimensions);
  }
};

export const getUploadDialogElement = () => dialogElement;

export const setUploadDialogElement = (element: HTMLElement | null) => {
  dialogElement = element;
  notify();
};

export const getEditingAssetId = () => editingAssetId;

export const getDraftPreference = (): AssetOptimizationPreference => {
  if (draftPreference) {
    return draftPreference;
  }

  return STABLE_EMPTY_DRAFT;
};

export const openAssetEditor = (assetId: string) => {
  editingAssetId = assetId;
  draftPreference = structuredClone(getAssetPreference(assetId));

  if (draftPreference.choice === 'custom') {
    const seeded = createCustomForAsset(assetId);
    const current = draftPreference.custom ?? seeded;

    draftPreference.custom = {
      ...current,
      maxWidth: current.maxWidth > 0 ? current.maxWidth : seeded.maxWidth,
      maxHeight: current.maxHeight > 0 ? current.maxHeight : seeded.maxHeight,
    };
  }

  notify();
};

export const closeAssetEditor = () => {
  editingAssetId = null;
  draftPreference = null;
  notify();
};

export const setDraftChoice = (choice: OptimizationChoice) => {
  if (!draftPreference) {
    draftPreference = createDefaultPreference();
  }

  draftPreference = {
    choice,
    custom:
      choice === 'custom'
        ? draftPreference.custom ?? createCustomForAsset(editingAssetId ?? '')
        : undefined,
  };
  notify();
};

export const setDraftCustom = (custom: OptimizationSettings) => {
  if (!draftPreference) {
    draftPreference = createDefaultPreference();
  }

  draftPreference = {
    choice: 'custom',
    custom,
  };
  notify();
};

export const saveAssetEditor = () => {
  if (editingAssetId && draftPreference) {
    setAssetPreference(editingAssetId, structuredClone(draftPreference));
  }
  closeAssetEditor();
};

const cardsEqual = (left: UploadAssetEntry[], right: UploadAssetEntry[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (entry, index) =>
      entry.assetId === right[index]?.assetId &&
      entry.assetName === right[index]?.assetName &&
      entry.width === right[index]?.width &&
      entry.height === right[index]?.height &&
      entry.actionsContainer === right[index]?.actionsContainer &&
      entry.footerHost === right[index]?.footerHost
  );
};

export const setUploadAssetCards = (nextCards: UploadAssetEntry[]) => {
  if (cardsEqual(cards, nextCards)) {
    return;
  }

  cards = nextCards;
  cardsSnapshot = nextCards.slice();
  notify();
};

export const clearUploadSession = () => {
  assetPreferencesById.clear();
  assetNamesById.clear();
  assetDimensionsById.clear();
  assetPreferencesByFileKey.clear();
  cards = [];
  cardsSnapshot = [];
  editingAssetId = null;
  draftPreference = null;
  dialogElement = null;
  notify();
};

const findPreferenceByAssetName = (
  name: string,
  file: File
): AssetOptimizationPreference | undefined => {
  for (const [assetId, assetName] of assetNamesById.entries()) {
    if (!namesMatch(assetName, name) && !namesMatch(assetName, file.name)) {
      continue;
    }

    const preference = assetPreferencesById.get(assetId);

    if (preference) {
      assetPreferencesByFileKey.set(
        buildFileKey(file.name, file.size, file.lastModified),
        preference
      );
    }

    return preference;
  }

  return undefined;
};

const normalizeName = (value: string) => value.trim().toLowerCase();

const namesMatch = (left: string, right: string) => normalizeName(left) === normalizeName(right);

const findCardForFile = (file: File, parsed: Record<string, unknown>, index: number, batchSize: number) => {
  if (batchSize > 1 && batchSize === cardsSnapshot.length) {
    return cardsSnapshot[index];
  }

  const candidates = [String(parsed.name ?? ''), file.name].filter(Boolean);

  for (const candidate of candidates) {
    const card = cardsSnapshot.find((entry) => namesMatch(entry.assetName, candidate));

    if (card) {
      return card;
    }
  }

  return undefined;
};

const resolvePreferenceForFile = (
  file: File,
  parsed: Record<string, unknown>,
  index: number,
  batchSize: number
): AssetOptimizationPreference => {
  const card = findCardForFile(file, parsed, index, batchSize);

  if (card) {
    const byCard = assetPreferencesById.get(card.assetId);

    if (byCard) {
      assetPreferencesByFileKey.set(
        buildFileKey(file.name, file.size, file.lastModified),
        byCard
      );
      return byCard;
    }
  }

  const name = String(parsed.name ?? file.name);
  const fileKey = buildFileKey(name, file.size, file.lastModified);

  const byFileKey = assetPreferencesByFileKey.get(fileKey);
  if (byFileKey) {
    return byFileKey;
  }

  const assetId = parsed.optimizerAssetId;
  if (typeof assetId === 'string') {
    const byId = assetPreferencesById.get(assetId);
    if (byId) {
      assetPreferencesByFileKey.set(fileKey, byId);
      return byId;
    }
  }

  const byName = findPreferenceByAssetName(name, file);
  if (byName) {
    return byName;
  }

  if (parsed.optimizationChoice) {
    return {
      choice: parsed.optimizationChoice as OptimizationChoice,
      custom: parsed.optimizationCustom as OptimizationSettings | undefined,
    };
  }

  return createDefaultPreference();
};

const buildFileInfoPayload = (
  parsed: Record<string, unknown>,
  preference: AssetOptimizationPreference
) => {
  const payload: Record<string, unknown> = {
    ...parsed,
    optimizationChoice: preference.choice,
  };

  if (preference.choice === 'custom' && preference.custom) {
    payload.optimizationCustom = preference.custom;
  } else {
    delete payload.optimizationCustom;
  }

  delete payload.optimizationMode;

  return payload;
};

const isMediaUploadRequest = (url: string, method?: string) => {
  if (method?.toUpperCase() !== 'POST') {
    return false;
  }

  try {
    const pathname = new URL(url, window.location.origin).pathname.replace(/\/+$/, '') || '/';
    return pathname === '/upload';
  } catch {
    return url.includes('/upload') && !url.includes('/upload/actions/');
  }
};

export const patchUploadFetch = () => {
  if (fetchPatched || typeof window === 'undefined') {
    return;
  }

  fetchPatched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : null;
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method = init?.method ?? request?.method;
    const body = init?.body ?? request?.body;

    if (isMediaUploadRequest(url, method) && body instanceof FormData) {
      const sourceFormData = body;
      const nextFormData = new FormData();
      const files: File[] = [];
      const fileInfos: string[] = [];

      sourceFormData.forEach((value, key) => {
        if (key === 'files' && value instanceof File) {
          files.push(value);
        } else if (key === 'fileInfo' && typeof value === 'string') {
          fileInfos.push(value);
        }
      });

      const preferencesPayload: Array<{
        assetId?: string;
        fileName: string;
        preference: AssetOptimizationPreference;
      }> = [];

      files.forEach((file, index) => {
        nextFormData.append('files', file);

        const parsed = JSON.parse(fileInfos[index] ?? '{}') as Record<string, unknown>;
        const card = findCardForFile(file, parsed, index, files.length);

        let assetId = parsed.optimizerAssetId as string | undefined;
        if (!assetId && card) {
          assetId = card.assetId;
        }

        if (!assetId) {
          const name = String(parsed.name ?? file.name);
          for (const [id, assetName] of assetNamesById.entries()) {
            if (namesMatch(assetName, name) || namesMatch(assetName, file.name)) {
              assetId = id;
              break;
            }
          }
        }

        if (assetId) {
          parsed.optimizerAssetId = assetId;
        }

        const preference = resolvePreferenceForFile(file, parsed, index, files.length);

        preferencesPayload.push({
          assetId,
          fileName: file.name,
          preference,
        });

        nextFormData.append(
          'fileInfo',
          JSON.stringify(buildFileInfoPayload(parsed, preference))
        );
      });

      nextFormData.append('imageOptimizerPreferences', JSON.stringify(preferencesPayload));

      sourceFormData.forEach((value, key) => {
        if (key !== 'files' && key !== 'fileInfo') {
          nextFormData.append(key, value);
        }
      });

      return originalFetch(input, {
        ...init,
        method: method ?? init?.method ?? 'POST',
        body: nextFormData,
      });
    }

    return originalFetch(input, init);
  };
};

export const isPreferenceCustomized = (assetId: string) => {
  const current = getAssetPreference(assetId);
  const defaults = createDefaultPreference();

  return JSON.stringify(current) !== JSON.stringify(defaults);
};
