import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

interface ProgressRingProps {
  size?: number; // diameter
  strokeWidth?: number;
  progress: number; // 0..1
  color?: string;
  backgroundColor?: string;
  label?: string; // center label override
  sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 140,
  strokeWidth = 12,
  progress,
  color,
  backgroundColor,
  label,
  sublabel,
}) => {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  const fg = color ?? theme.colors.semantic.safe;
  const bg = backgroundColor ?? theme.colors.border;
  const percent = Math.round(clamped * 100);

  return (
    <View style={[styles(theme).container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: percent, min: 0, max: 100 }}
    >
      <Svg width={size} height={size}>
        <Circle
          stroke={bg}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={fg}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles(theme).centerLabel}>
        <Text style={styles(theme).labelText}>{label ?? `${percent}%`}</Text>
        {sublabel && <Text style={styles(theme).subText}>{sublabel}</Text>}
      </View>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  labelText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
    color: theme.colors.text,
  },
  subText: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
});

export default ProgressRing;

