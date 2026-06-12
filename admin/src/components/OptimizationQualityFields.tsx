import React from 'react';
import { Field, Grid, TextInput } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslationKey, type OptimizationSettings } from '../pluginId';
import { type QualityField } from '../utils/optimizationFields';

interface OptimizationQualityFieldsProps {
  value: Pick<OptimizationSettings, 'webpQuality' | 'jpegQuality' | 'pngCompressionLevel'>;
  fields: QualityField[];
  onChange: (patch: Partial<OptimizationSettings>) => void;
  disabled?: boolean;
  namePrefix?: string;
}

export const OptimizationQualityFields = ({
  value,
  fields,
  onChange,
  disabled = false,
  namePrefix = '',
}: OptimizationQualityFieldsProps) => {
  const { formatMessage } = useIntl();

  return (
    <>
      {fields.includes('webp') && (
        <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
          <Field.Root name={`${namePrefix}webpQuality`}>
            <Field.Label>
              {formatMessage({
                id: getTranslationKey('settings.global.webpQuality'),
                defaultMessage: 'WebP quality',
              })}
            </Field.Label>
            <TextInput
              type="number"
              min={1}
              max={100}
              value={value.webpQuality}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange({ webpQuality: Number(e.target.value) })
              }
              disabled={disabled}
            />
          </Field.Root>
        </Grid.Item>
      )}

      {fields.includes('jpeg') && (
        <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
          <Field.Root name={`${namePrefix}jpegQuality`}>
            <Field.Label>
              {formatMessage({
                id: getTranslationKey('settings.global.jpegQuality'),
                defaultMessage: 'JPEG quality',
              })}
            </Field.Label>
            <TextInput
              type="number"
              min={1}
              max={100}
              value={value.jpegQuality}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange({ jpegQuality: Number(e.target.value) })
              }
              disabled={disabled}
            />
          </Field.Root>
        </Grid.Item>
      )}

      {fields.includes('png') && (
        <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
          <Field.Root name={`${namePrefix}pngCompression`}>
            <Field.Label>
              {formatMessage({
                id: getTranslationKey('settings.global.pngCompression'),
                defaultMessage: 'PNG compression level',
              })}
            </Field.Label>
            <TextInput
              type="number"
              min={0}
              max={9}
              value={value.pngCompressionLevel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange({ pngCompressionLevel: Number(e.target.value) })
              }
              disabled={disabled}
            />
          </Field.Root>
        </Grid.Item>
      )}
    </>
  );
};
