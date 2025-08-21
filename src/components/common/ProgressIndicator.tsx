import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';

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
  color = '#006064',
  accessibilityLabel,
}) => {
  const progress = currentStep / totalSteps;
  const stepLabel = `${currentStep} of ${totalSteps}`;

  return (
    <View style={styles.container}>
      <ProgressBar
        progress={progress}
        color={color}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  stepLabel: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666666',
  },
});