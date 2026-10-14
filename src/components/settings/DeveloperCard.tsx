import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { Card } from '../ui/Card';
import { PressableScale } from '../ui/PressableScale';
import { DEVELOPER } from '../../constants';
import { BrandLogo } from './BrandLogo';

const open = (url: string) => Linking.openURL(url).catch(() => {});

/** Credits for the app's developer with a single contact action. */
export const DeveloperCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();

  return (
    <Card title="Developer" icon="code-tags" iconMotion="float" delay={delay}>
      <View style={styles.profile}>
        <BrandLogo size={58} from={colors.accent} to={colors.icon.sun} />
        <View style={styles.flex}>
          <Text style={styles.name}>{DEVELOPER.name}</Text>
          <Text style={styles.role}>{DEVELOPER.role}</Text>
        </View>
      </View>

      <PressableScale
        onPress={() => open(`mailto:${DEVELOPER.email}?subject=${encodeURIComponent('WeatherNow feedback')}`)}
        style={[styles.primary, { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}40` }]}
        accessibilityRole="link"
        accessibilityLabel="Contact us by email"
      >
        <View style={[styles.mailIcon, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="email-outline" size={18} color={colors.onAccent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.primaryTitle, { color: colors.text }]}>Contact us</Text>
          <Text style={[styles.primarySub, { color: colors.textSecondary }]}>Feedback, support or business inquiries</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.accent} />
      </PressableScale>
    </Card>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    name: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
    },
    role: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 1,
    },
    mailIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    primaryTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
    },
    primarySub: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      opacity: 0.85,
    },
  });
