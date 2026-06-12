import React from 'react';
import { Field, Grid, TextInput, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslationKey, type OptimizationSettings } from '../pluginId';

interface OptimizationResizeFieldsProps {
  value: Pick<OptimizationSettings, 'maxWidth' | 'maxHeight'>;
  sourceWidth?: number;
  sourceHeight?: number;
  onChange: (patch: Partial<OptimizationSettings>) => void;
  disabled?: boolean;
  namePrefix?: string;
}

export const OptimizationResizeFields = ({
  value,
  sourceWidth,
  sourceHeight,
  onChange,
  disabled = false,
  namePrefix = '',
}: OptimizationResizeFieldsProps) => {
  const { formatMessage } = useIntl();

  const aspectRatio =
    sourceWidth && sourceHeight && sourceHeight > 0 ? sourceWidth / sourceHeight : null;

  const handleWidthChange = (rawValue: string) => {
    const nextWidth = Math.max(1, Number(rawValue) || 1);

    if (!aspectRatio) {
      onChange({ maxWidth: nextWidth });
      return;
    }

    onChange({
      maxWidth: nextWidth,
      maxHeight: Math.max(1, Math.round(nextWidth / aspectRatio)),
    });
  };

  const handleHeightChange = (rawValue: string) => {
    const nextHeight = Math.max(1, Number(rawValue) || 1);

    if (!aspectRatio) {
      onChange({ maxHeight: nextHeight });
      return;
    }

    onChange({
      maxHeight: nextHeight,
      maxWidth: Math.max(1, Math.round(nextHeight * aspectRatio)),
    });
  };

  return (
    <>
      <Grid.Item col={12} direction="column" alignItems="stretch">
        <Typography variant="pi" fontWeight="bold" textColor="neutral800">
          {formatMessage({
            id: getTranslationKey('settings.resize.title'),
            defaultMessage: 'Output dimensions',
          })}
        </Typography>
      </Grid.Item>

      <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
        <Field.Root name={`${namePrefix}maxWidth`}>
          <Field.Label>
            {formatMessage({
              id: getTranslationKey('settings.resize.width'),
              defaultMessage: 'Width (px)',
            })}
          </Field.Label>
          <TextInput
            type="number"
            min={1}
            value={value.maxWidth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWidthChange(e.target.value)}
            disabled={disabled}
          />
        </Field.Root>
      </Grid.Item>

      <Grid.Item col={6} xs={12} direction="column" alignItems="stretch">
        <Field.Root name={`${namePrefix}maxHeight`}>
          <Field.Label>
            {formatMessage({
              id: getTranslationKey('settings.resize.height'),
              defaultMessage: 'Height (px)',
            })}
          </Field.Label>
          <TextInput
            type="number"
            min={1}
            value={value.maxHeight}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleHeightChange(e.target.value)}
            disabled={disabled}
          />
        </Field.Root>
      </Grid.Item>

      <Grid.Item col={12} direction="column" alignItems="stretch">
        <Typography variant="pi" textColor="neutral600">
          {formatMessage({
            id: getTranslationKey('settings.resize.hint'),
            defaultMessage:
              'Defaults to the original image size. Change either value to resize; the other updates to keep aspect ratio.',
          })}
        </Typography>
      </Grid.Item>
    </>
  );
};
