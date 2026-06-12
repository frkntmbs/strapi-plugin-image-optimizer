export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/default-mode',
        handler: 'preference.getDefaultMode',
        config: {
          policies: ['admin::isAuthenticatedAdmin'],
        },
      },
      {
        method: 'GET',
        path: '/preference',
        handler: 'preference.getPreference',
        config: {
          policies: ['admin::isAuthenticatedAdmin'],
        },
      },
      {
        method: 'PUT',
        path: '/preference',
        handler: 'preference.updatePreference',
        config: {
          policies: ['admin::isAuthenticatedAdmin'],
        },
      },
      {
        method: 'GET',
        path: '/settings',
        handler: 'preference.getSettings',
        config: {
          policies: [
            'admin::isAuthenticatedAdmin',
            {
              name: 'admin::hasPermissions',
              config: {
                actions: ['plugin::image-optimizer.settings.read'],
              },
            },
          ],
        },
      },
      {
        method: 'PUT',
        path: '/settings',
        handler: 'preference.updateSettings',
        config: {
          policies: [
            'admin::isAuthenticatedAdmin',
            {
              name: 'admin::hasPermissions',
              config: {
                actions: ['plugin::image-optimizer.settings.update'],
              },
            },
          ],
        },
      },
    ],
  },
};
