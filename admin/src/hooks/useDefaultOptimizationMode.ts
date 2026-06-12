import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID, type GlobalOptimizationSettings } from '../pluginId';

export const useDefaultOptimizationMode = () => {
  const { get } = useFetchClient();
  const [globalSettings, setGlobalSettings] = useState<GlobalOptimizationSettings>({
    defaultChoice: 'original',
    defaultMode: 'compress',
    webpQuality: 82,
    jpegQuality: 80,
    pngCompressionLevel: 9,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await get(`/${PLUGIN_ID}/default-mode`);
        setGlobalSettings({
          defaultChoice: data.defaultChoice ?? 'original',
          defaultMode: data.defaultMode ?? 'compress',
          webpQuality: data.webpQuality ?? 82,
          jpegQuality: data.jpegQuality ?? 80,
          pngCompressionLevel: data.pngCompressionLevel ?? 9,
        });
      } catch {
        // Fallback stays in state.
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [get]);

  return { globalSettings, defaultMode: globalSettings.defaultMode, isLoading };
};
