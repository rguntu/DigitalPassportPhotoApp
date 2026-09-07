import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

const DEFAULT_ITEMS = [
  'Eyes open, looking at camera',
  'Face centered in the oval',
  'Neutral expression, mouth closed',
  'Plain light background',
];

export default function ComplianceChecklist({ country, items = DEFAULT_ITEMS }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{country} photo checklist</Text>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <MaterialIcons name="check-circle" size={16} color={colors.primary} />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
      <Text style={styles.disclaimer}>
        This app helps you prepare photos that match common size guidelines. It is not a government
        service and does not guarantee acceptance.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  disclaimer: {
    marginTop: spacing.sm,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
});
