import React from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { TextInput as PaperTextInput, TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { useTheme } from '@/theme/ThemeProvider';

export interface FormInputProps extends Omit<PaperTextInputProps, 'mode'> {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

/**
 * FormInput
 * A lightly styled input that matches our app style: faint surface background,
 * rounded corners, subtle border, and no Material underline.
 */
const FormInput: React.FC<FormInputProps> = ({ containerStyle, inputStyle, error, style, ...rest }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <PaperTextInput
      // Use flat but hide underline to avoid Material look
      mode="flat"
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      // Visual style
      style={[
        styles.input,
        // Use a border only to signal error; otherwise borderless like search bar
        { borderColor: error ? theme.colors.error : 'transparent', borderWidth: error ? 1 : 0 },
        style,
        inputStyle,
      ]}
      placeholderTextColor={theme.colors.placeholder}
      outlineColor="transparent"
      selectionColor={theme.colors.primary}
      textColor={theme.colors.text}
      {...rest}
    />
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    input: {
      backgroundColor: theme.mode === 'light' ? '#F5F7F8' : theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      // Ensure label (if provided) does not float awkwardly
      // Consumers should prefer a separate <Text> label above.
    },
  });

export default FormInput;
