import { Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslationKey, type OptimizationMode } from '../pluginId';

interface OptimizationModeSelectCompactProps {
  value: OptimizationMode;
  onChange: (mode: OptimizationMode) => void;
  disabled?: boolean;
}

const MODES: OptimizationMode[] = ['webp', 'compress'];

export const OptimizationModeSelectCompact = ({
  value,
  onChange,
  disabled = false,
}: OptimizationModeSelectCompactProps) => {
  const { formatMessage } = useIntl();

  return (
    <Field.Root name="optimizationMode">
      <Field.Label>
        {formatMessage({ id: getTranslationKey('upload.optimization.label') })}
      </Field.Label>
      <SingleSelect
        size="S"
        value={value}
        onChange={(selected: OptimizationMode) => onChange(selected)}
        disabled={disabled}
      >
        {MODES.map((mode) => (
          <SingleSelectOption key={mode} value={mode}>
            {formatMessage({ id: getTranslationKey(`settings.mode.${mode}`) })}
          </SingleSelectOption>
        ))}
      </SingleSelect>
    </Field.Root>
  );
};
