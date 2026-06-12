import { getTranslationKey, PLUGIN_ID } from './pluginId';
import { initUploadEnhancer } from './utils/initUploadEnhancer';
import { patchUploadFetch } from './utils/uploadAssetStore';

const prefixPluginTranslations = (
  trad: Record<string, string>,
  pluginId: string
): Record<string, string> => {
  return Object.entries(trad).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[`${pluginId}.${key}`] = value;
    return acc;
  }, {});
};

export default {
  register(app) {
    app.addSettingsLink('global', {
      id: 'image-optimizer',
      to: 'image-optimizer',
      intlLabel: {
        id: getTranslationKey('settings.section-label'),
        defaultMessage: 'Image Optimizer',
      },
      Component: () =>
        import('./pages/SettingsPage').then((mod) => ({
          default: mod.ProtectedSettingsPage,
        })),
      permissions: [],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
    });
  },

  bootstrap() {
    patchUploadFetch();
    initUploadEnhancer();
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return {
            data: prefixPluginTranslations(data, PLUGIN_ID),
            locale,
          };
        } catch {
          return { data: {}, locale };
        }
      })
    );

    return importedTrads;
  },
};
