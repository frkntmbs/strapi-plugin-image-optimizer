import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from './constants';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  await strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Read Image Optimizer settings',
      uid: 'settings.read',
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Update Image Optimizer settings',
      uid: 'settings.update',
      pluginName: PLUGIN_ID,
    },
  ]);
};
