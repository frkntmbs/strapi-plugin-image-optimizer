import React, { useSyncExternalStore } from 'react';
import { DesignSystemProvider, darkTheme, lightTheme } from '@strapi/design-system';
import { IntlProvider } from 'react-intl';
import { UploadEnhancerBridge } from './UploadEnhancerBridge';
import { PLUGIN_ID } from '../pluginId';
import {
  getEditingAssetId,
  subscribeUploadAssets,
} from '../utils/uploadAssetStore';

const THEME_KEY = 'STRAPI_THEME';

const enMessages: Record<string, string> = {
  [`${PLUGIN_ID}.upload.button.label`]: 'Optimization settings',
  [`${PLUGIN_ID}.upload.modal.title`]: 'Image optimization',
  [`${PLUGIN_ID}.upload.modal.save`]: 'Save',
  [`${PLUGIN_ID}.upload.modal.cancel`]: 'Cancel',
  [`${PLUGIN_ID}.settings.mode.webp`]: 'Convert to WebP',
  [`${PLUGIN_ID}.settings.mode.webp.description`]:
    'JPEG and PNG files are converted to WebP format for significantly smaller file sizes.',
  [`${PLUGIN_ID}.settings.mode.compress`]: 'Compress (keep format)',
  [`${PLUGIN_ID}.settings.mode.compress.description`]:
    'Keeps the original format while reducing quality to shrink file size.',
  [`${PLUGIN_ID}.choice.original`]: 'Keep original',
  [`${PLUGIN_ID}.choice.original.description`]:
    'No optimization is applied. The file is uploaded exactly as selected.',
  [`${PLUGIN_ID}.choice.global`]: 'Apply global settings',
  [`${PLUGIN_ID}.choice.global.description`]:
    'Uses the global optimization profile configured in Settings.',
  [`${PLUGIN_ID}.choice.custom`]: 'Custom',
  [`${PLUGIN_ID}.choice.custom.description`]:
    'Configure format and quality settings specifically for this image.',
  [`${PLUGIN_ID}.settings.global.defaultMode`]: 'Optimization format',
  [`${PLUGIN_ID}.settings.global.webpQuality`]: 'WebP quality',
  [`${PLUGIN_ID}.settings.global.jpegQuality`]: 'JPEG quality',
  [`${PLUGIN_ID}.settings.global.pngCompression`]: 'PNG compression level',
  [`${PLUGIN_ID}.settings.resize.title`]: 'Output dimensions',
  [`${PLUGIN_ID}.settings.resize.width`]: 'Width (px)',
  [`${PLUGIN_ID}.settings.resize.height`]: 'Height (px)',
  [`${PLUGIN_ID}.settings.resize.hint`]:
    'Defaults to the original image size. Change either value to resize; the other updates to keep aspect ratio.',
  [`${PLUGIN_ID}.upload.mode.footer.global`]: 'Global: {mode}',
  [`${PLUGIN_ID}.upload.mode.footer.custom`]: 'Custom: {mode}',
};

const getTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);

  if (stored === 'dark') {
    return darkTheme;
  }

  if (stored === 'system' || !stored) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme;
  }

  return lightTheme;
};

export const BridgeProviders = ({ children }: { children: React.ReactNode }) => {
  const editingAssetId = useSyncExternalStore(subscribeUploadAssets, getEditingAssetId);
  const [theme, setTheme] = React.useState(getTheme);

  React.useEffect(() => {
    setTheme(getTheme());
  }, [editingAssetId]);

  React.useEffect(() => {
    const syncTheme = () => setTheme(getTheme());
    window.addEventListener('storage', syncTheme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', syncTheme);

    return () => {
      window.removeEventListener('storage', syncTheme);
      media.removeEventListener('change', syncTheme);
    };
  }, []);

  return (
    <IntlProvider locale="en" messages={enMessages} defaultLocale="en">
      <DesignSystemProvider locale="en-GB" theme={theme}>
        {children}
      </DesignSystemProvider>
    </IntlProvider>
  );
};

export const UploadEnhancerRoot = () => (
  <BridgeProviders>
    <UploadEnhancerBridge />
  </BridgeProviders>
);
