import React from 'react';
import {
  Field,
  Grid,
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslationKey, type OptimizationMode, type OptimizationSettings } from '../pluginId';
import { getQualityFieldsForMode } from '../utils/optimizationFields';
import { OptimizationQualityFields } from './OptimizationQualityFields';
import { OptimizationResizeFields } from './OptimizationResizeFields';

interface OptimizationCustomFormProps {
  value: OptimizationSettings;
  onChange: (value: OptimizationSettings) => void;
  assetName?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  disabled?: boolean;
}

const MODES: OptimizationMode[] = ['webp', 'compress'];

export const OptimizationCustomForm = ({
  value,
  onChange,
  assetName,
  sourceWidth,
  sourceHeight,
  disabled = false,
}: OptimizationCustomFormProps) => {
  const { formatMessage } = useIntl();

  const update = (patch: Partial<OptimizationSettings>) => {
    onChange({ ...value, ...patch });
  };

  const qualityFields = getQualityFieldsForMode(value.mode, assetName);

  return (
    <Grid.Root gap={4}>
      <Grid.Item col={12} direction="column" alignItems="stretch">
        <Field.Root name="customMode">
          <Field.Label>
            {formatMessage({
              id: getTranslationKey('settings.global.defaultMode'),
              defaultMessage: 'Optimization format',
            })}
          </Field.Label>
          <SingleSelect
            value={value.mode}
            onChange={(mode: OptimizationMode) => update({ mode })}
            disabled={disabled}
          >
            {MODES.map((mode) => (
              <SingleSelectOption key={mode} value={mode}>
                {formatMessage({
                  id: getTranslationKey(`settings.mode.${mode}`),
                  defaultMessage: mode,
                })}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Field.Root>
      </Grid.Item>

      <OptimizationQualityFields
        value={value}
        fields={qualityFields}
        onChange={update}
        disabled={disabled}
        namePrefix="custom"
      />

      <OptimizationResizeFields
        value={value}
        sourceWidth={sourceWidth}
        sourceHeight={sourceHeight}
        onChange={update}
        disabled={disabled}
        namePrefix="custom"
      />
    </Grid.Root>
  );
};
