import { StyleSheet, Text, View } from 'react-native';
import { colors, FLOW_STEPS, spacing } from '../theme';

export default function StepIndicator({ current }) {
  const currentIndex = Math.max(
    0,
    FLOW_STEPS.findIndex((step) => step.key === current)
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {FLOW_STEPS.map((step, index) => {
        const active = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={step.key} style={styles.item}>
            <View style={[styles.dot, active && styles.dotActive, isCurrent && styles.dotCurrent]}>
              <Text style={[styles.dotText, active && styles.dotTextActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.label, isCurrent && styles.labelCurrent]}>{step.label}</Text>
            {index < FLOW_STEPS.length - 1 ? (
              <View style={[styles.line, index < currentIndex && styles.lineActive]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    transform: [{ scale: 1.08 }],
  },
  dotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dotTextActive: {
    color: colors.white,
  },
  label: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  labelCurrent: {
    color: colors.text,
  },
  line: {
    width: 18,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  lineActive: {
    backgroundColor: colors.primary,
  },
});
