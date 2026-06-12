import {
  Box,
  Field,
  Flex,
  Radio,
  Typography,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslationKey, type OptimizationChoice } from '../pluginId';

interface OptimizationChoicePickerProps {
  value: OptimizationChoice;
  onChange: (choice: OptimizationChoice) => void;
  disabled?: boolean;
}

const CHOICES: OptimizationChoice[] = ['original', 'global', 'custom'];

export const OptimizationChoicePicker = ({
  value,
  onChange,
  disabled = false,
}: OptimizationChoicePickerProps) => {
  const { formatMessage } = useIntl();

  return (
    <Field.Root name="optimizationChoice">
      <Radio.Group
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as OptimizationChoice)}
        disabled={disabled}
      >
        <Flex direction="column" gap={3} alignItems="stretch">
          {CHOICES.map((choice) => {
            const selected = value === choice;

            return (
              <Box
                key={choice}
                padding={4}
                hasRadius
                background={selected ? 'primary100' : 'neutral100'}
                onClick={() => {
                  if (!disabled) {
                    onChange(choice);
                  }
                }}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <Radio.Item value={choice} id={`optimizer-choice-${choice}`}>
                  {formatMessage({ id: getTranslationKey(`choice.${choice}`) })}
                </Radio.Item>
                <Box paddingLeft={6} paddingTop={1} style={{ pointerEvents: 'none' }}>
                  <Typography variant="pi" textColor="neutral600">
                    {formatMessage({ id: getTranslationKey(`choice.${choice}.description`) })}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Flex>
      </Radio.Group>
    </Field.Root>
  );
};
