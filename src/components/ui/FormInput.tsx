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
        { borderColor: error ? theme.colors.error : theme.colors.border },
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
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      // Ensure label (if provided) does not float awkwardly
      // Consumers should prefer a separate <Text> label above.
    },
  });

export default FormInput;

