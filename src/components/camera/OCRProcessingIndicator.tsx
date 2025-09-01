import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { Text, ProgressBar, Card, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

interface OCRProcessingIndicatorProps {
  /** Processing progress (0-100) */
  progress: number;
  /** Processing message to display */
  message: string;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * OCR processing indicator with progress and status
 * 
 * Features:
 * - Animated progress bar
 * - Status message updates
 * - Visual feedback during processing
 * - Gradient background for visibility
 * - Accessibility support
 */
export const OCRProcessingIndicator: React.FC<OCRProcessingIndicatorProps> = ({
  progress,
  message,
  style,
}) => {
  const { theme } = useTheme();
  const progressValue = Math.max(0, Math.min(100, progress)) / 100;

  return (
    <View style={[styles.container, style]}>
      <Card style={[styles.card, { borderRadius: theme.borderRadius.lg }]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          style={styles.gradient}
        >
          <Card.Content style={styles.content}>
            {/* Processing icon and title */}
            <View style={styles.header}>
              <ActivityIndicator 
                size="small" 
                color="#FFFFFF" 
                style={styles.spinner}
              />
              <Text variant="titleMedium" style={styles.title}>
                Processing Menu
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progressValue}
                color={theme.colors.semantic.safe}
                style={styles.progressBar}
              />
              <Text variant="bodySmall" style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>

            {/* Status message */}
            <Text 
              variant="bodyMedium" 
              style={styles.message}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Processing status: ${message}`}
            >
              {message}
            </Text>

            {/* Processing steps indicator */}
            <View style={styles.stepsContainer}>
              <ProcessingStep
                label="Capture"
                completed={progress > 0}
                active={progress <= 30}
              />
              <ProcessingStep
                label="Extract"
                completed={progress > 30}
                active={progress > 30 && progress <= 60}
              />
              <ProcessingStep
                label="Analyze"
                completed={progress > 60}
                active={progress > 60 && progress <= 90}
              />
              <ProcessingStep
                label="Complete"
                completed={progress > 90}
                active={progress > 90}
              />
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>
    </View>
  );
};

/**
 * Individual processing step indicator
 */
interface ProcessingStepProps {
  label: string;
  completed: boolean;
  active: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({
  label,
  completed,
  active,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepIndicator,
          completed && { backgroundColor: theme.colors.semantic.safe },
          active && { backgroundColor: theme.colors.semantic.caution },
        ]}
      >
        {completed && (
          <Text style={styles.stepCheckmark}>✓</Text>
        )}
      </View>
      <Text
        variant="bodySmall"
        style={[
          styles.stepLabel,
          (completed || active) && styles.stepLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: isSmallDevice ? 300 : 350,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    elevation: 0,
  },
  gradient: {
    width: '100%',
  },
  content: {
    padding: isSmallDevice ? 16 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  progressText: {
    color: '#FFFFFF',
    textAlign: 'right',
    opacity: 0.9,
  },
  message: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepIndicator: {
    width: isSmallDevice ? 20 : 24,
    height: isSmallDevice ? 20 : 24,
    borderRadius: isSmallDevice ? 10 : 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepActive: {
    backgroundColor: '#FF9800',
  },
  stepCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
