import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { useTheme } from '@/theme/ThemeProvider';

interface ProgressIndicatorProps {
  /** Current step (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional label to show current step */
  showStepLabel?: boolean;
  /** Custom color for progress bar */
  color?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * Progress indicator component for onboarding flow
 * Shows visual progress through multi-step processes
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  showStepLabel = true,
  color,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const progress = currentStep / totalSteps;
  const stepLabel = `${currentStep} of ${totalSteps}`;
  const progressColor = color || theme.colors.primary;
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ProgressBar
        progress={progress}
        color={progressColor}
        style={styles.progressBar}
        accessibilityLabel={accessibilityLabel || `Progress: ${stepLabel}`}
      />
      {showStepLabel && (
        <Text style={styles.stepLabel} variant="bodySmall">
          Step {stepLabel}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  stepLabel: {
    textAlign: 'center',
    marginTop: 8,
    color: theme.colors.textSecondary,
  },
});