import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import {
  Layouts,
  Page,
  useFetchClient,
  useNotification,
  useRBAC,
} from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { OptimizationQualityFields } from '../components/OptimizationQualityFields';
import {
  getTranslationKey,
  PLUGIN_ID,
  type GlobalOptimizationSettings,
  type OptimizationChoice,
  type OptimizationMode,
} from '../pluginId';

const SETTINGS_READ = [{ action: 'plugin::image-optimizer.settings.read', subject: null }];
const SETTINGS_UPDATE = [{ action: 'plugin::image-optimizer.settings.update', subject: null }];

const CHOICES: OptimizationChoice[] = ['original', 'global', 'custom'];
const MODES: OptimizationMode[] = ['webp', 'compress'];

export const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { allowedActions: readActions } = useRBAC(SETTINGS_READ);
  const { allowedActions: updateActions } = useRBAC(SETTINGS_UPDATE);

  const canReadGlobal = readActions.canRead;
  const canUpdateGlobal = updateActions.canUpdate;

  const [globalSettings, setGlobalSettings] = useState<GlobalOptimizationSettings>({
    defaultChoice: 'original',
    defaultMode: 'compress',
    webpQuality: 82,
    jpegQuality: 80,
    pngCompressionLevel: 9,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!canReadGlobal) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: settings } = await get(`/${PLUGIN_ID}/settings`);
        setGlobalSettings(settings);
      } catch {
        toggleNotification({
          type: 'danger',
          message: formatMessage({ id: getTranslationKey('settings.error') }),
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [canReadGlobal, formatMessage, get, toggleNotification]);

  const handleSave = async () => {
    if (!canUpdateGlobal) {
      return;
    }

    setIsSaving(true);

    try {
      await put(`/${PLUGIN_ID}/settings`, globalSettings);

      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTranslationKey('settings.saved') }),
      });
    } catch {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: getTranslationKey('settings.error') }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Page.Loading />;
  }

  if (!canReadGlobal) {
    return (
      <Page.Main>
        <Page.Title>
          {formatMessage({ id: getTranslationKey('settings.page.title') })}
        </Page.Title>
        <Layouts.Header
          title={formatMessage({ id: getTranslationKey('settings.page.title') })}
          subtitle={formatMessage({ id: getTranslationKey('settings.page.description') })}
        />
        <Layouts.Content>
          <Typography textColor="neutral600">
            {formatMessage({ id: getTranslationKey('settings.global.noPermission') })}
          </Typography>
        </Layouts.Content>
      </Page.Main>
    );
  }

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({ id: getTranslationKey('settings.page.title') })}
      </Page.Title>
      <Layouts.Header
        title={formatMessage({ id: getTranslationKey('settings.page.title') })}
        subtitle={formatMessage({ id: getTranslationKey('settings.page.description') })}
        primaryAction={
          canUpdateGlobal ? (
            <Button onClick={handleSave} loading={isSaving} startIcon={<Check />} size="S">
              {formatMessage({ id: getTranslationKey('settings.save') })}
            </Button>
          ) : undefined
        }
      />
      <Layouts.Content>
        <Layouts.Root>
          <Flex direction="column" alignItems="stretch" gap={6}>
            <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
              <Typography variant="delta" tag="h2">
                {formatMessage({ id: getTranslationKey('settings.global.defaultChoiceTitle') })}
              </Typography>
              <Box paddingTop={2} paddingBottom={4}>
                <Typography textColor="neutral600">
                  {formatMessage({ id: getTranslationKey('settings.global.defaultChoiceDescription') })}
                </Typography>
              </Box>

              <Grid.Root gap={6}>
                <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
                  <Field.Root name="defaultChoice">
                    <Field.Label>
                      {formatMessage({ id: getTranslationKey('settings.global.defaultChoice') })}
                    </Field.Label>
                    <SingleSelect
                      value={globalSettings.defaultChoice}
                      onChange={(value: OptimizationChoice) =>
                        setGlobalSettings((prev) => ({ ...prev, defaultChoice: value }))
                      }
                      disabled={!canUpdateGlobal || isSaving}
                    >
                      {CHOICES.map((choice) => (
                        <SingleSelectOption key={choice} value={choice}>
                          {formatMessage({ id: getTranslationKey(`choice.${choice}`) })}
                        </SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <Field.Hint>
                      {formatMessage({ id: getTranslationKey('settings.global.defaultChoiceHint') })}
                    </Field.Hint>
                  </Field.Root>
                </Grid.Item>
              </Grid.Root>
            </Box>

            <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
              <Typography variant="delta" tag="h2">
                {formatMessage({ id: getTranslationKey('settings.global.profileTitle') })}
              </Typography>
              <Box paddingTop={2} paddingBottom={4}>
                <Typography textColor="neutral600">
                  {formatMessage({ id: getTranslationKey('settings.global.profileDescription') })}
                </Typography>
              </Box>

              <Grid.Root gap={6}>
                <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
                  <Field.Root name="defaultMode">
                    <Field.Label>
                      {formatMessage({ id: getTranslationKey('settings.global.defaultMode') })}
                    </Field.Label>
                    <SingleSelect
                      value={globalSettings.defaultMode}
                      onChange={(value: OptimizationMode) =>
                        setGlobalSettings((prev) => ({ ...prev, defaultMode: value }))
                      }
                      disabled={!canUpdateGlobal || isSaving}
                    >
                      {MODES.map((mode) => (
                        <SingleSelectOption key={mode} value={mode}>
                          {formatMessage({ id: getTranslationKey(`settings.mode.${mode}`) })}
                        </SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <Field.Hint>
                      {formatMessage({ id: getTranslationKey('settings.global.defaultModeHint') })}
                    </Field.Hint>
                  </Field.Root>
                </Grid.Item>

                <OptimizationQualityFields
                  value={globalSettings}
                  fields={
                    globalSettings.defaultMode === 'webp'
                      ? ['webp']
                      : ['webp', 'jpeg', 'png']
                  }
                  onChange={(patch) => setGlobalSettings((prev) => ({ ...prev, ...patch }))}
                  disabled={!canUpdateGlobal || isSaving}
                  namePrefix="global"
                />
              </Grid.Root>
            </Box>
          </Flex>
        </Layouts.Root>
      </Layouts.Content>
    </Page.Main>
  );
};

export const ProtectedSettingsPage = () => {
  return <SettingsPage />;
};
