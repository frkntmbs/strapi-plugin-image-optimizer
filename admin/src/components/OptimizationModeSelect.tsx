import React from 'react';
import {
  Box,
  Flex,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslationKey, type OptimizationMode } from '../pluginId';

interface OptimizationModeSelectProps {
  value: OptimizationMode;
  onChange: (mode: OptimizationMode) => void;
  disabled?: boolean;
}

const MODES: OptimizationMode[] = ['webp', 'compress'];

export const OptimizationModeSelect = ({
  value,
  onChange,
  disabled = false,
}: OptimizationModeSelectProps) => {
  const { formatMessage } = useIntl();

  return (
    <Flex direction="column" gap={4} alignItems="stretch">
      <SingleSelect
        value={value}
        onChange={(selected: OptimizationMode) => onChange(selected)}
        disabled={disabled}
        placeholder="Select optimization mode"
      >
        {MODES.map((mode) => (
          <SingleSelectOption key={mode} value={mode}>
            {formatMessage({ id: getTranslationKey(`settings.mode.${mode}`) })}
          </SingleSelectOption>
        ))}
      </SingleSelect>

      <Box padding={4} hasRadius background="neutral100">
        <Typography variant="pi" textColor="neutral600">
          {formatMessage({ id: getTranslationKey(`settings.mode.${value}.description`) })}
        </Typography>
      </Box>
    </Flex>
  );
};
