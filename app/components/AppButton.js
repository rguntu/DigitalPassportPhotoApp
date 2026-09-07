import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radii, spacing } from '../theme';

export function PrimaryButton({ title, onPress, disabled, loading, style, fullWidth }) {
  return (
    <TouchableOpacity
      style={[
        styles.primary,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.primaryText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, disabled, style, fullWidth }) {
  return (
    <TouchableOpacity
      style={[
        styles.secondary,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.secondaryText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
