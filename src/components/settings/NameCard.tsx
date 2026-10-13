import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme, useStyles, useTheme } from '../../theme/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { Card } from '../ui/Card';
import { PressableScale } from '../ui/PressableScale';
import { cleanName, greetingName, prettyName } from '../../utils/format';
import { haptic } from '../../utils/haptics';

/** Shows the saved name with an Edit button; editing has explicit Save / Cancel. */
export const NameCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const userName = useSettingsStore((s) => s.userName);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const [editing, setEditing] = useState(!userName);
  const [draft, setDraft] = useState(userName);
  const [justSaved, setJustSaved] = useState(false);

  const clean = cleanName(draft);
  const canSave = clean.length > 0 && clean !== userName;

  const save = () => {
    if (!canSave) return;
    setUserName(clean);
    setEditing(false);
    haptic.success();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const startEdit = () => {
    setDraft(userName);
    setEditing(true);
  };

  const remove = () => {
    setUserName('');
    setDraft('');
    setEditing(true);
  };

  return (
    <Card title="Your name" icon="account-heart-outline" iconMotion="pulse" delay={delay} right={justSaved ? <SavedBadge /> : null}>
      {editing ? (
        <Animated.View key="edit" entering={FadeIn.duration(220)}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Your first name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoFocus={!!userName}
            returnKeyType="done"
            onSubmitEditing={save}
            maxLength={30}
          />
          <Text style={styles.hint}>We'll use it to greet you in your good-morning brief.</Text>
          <View style={styles.actions}>
            {userName ? (
              <PressableScale onPress={() => setEditing(false)} style={[styles.button, styles.ghost]}>
                <Text style={styles.ghostText}>Cancel</Text>
              </PressableScale>
            ) : null}
            <PressableScale
              onPress={save}
              disabled={!canSave}
              style={[styles.button, { backgroundColor: colors.accent, opacity: canSave ? 1 : 0.45 }]}
              accessibilityState={{ disabled: !canSave }}
            >
              <MaterialCommunityIcons name="check" size={16} color={colors.onAccent} />
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>Save</Text>
            </PressableScale>
          </View>
        </Animated.View>
      ) : (
        <Animated.View key="view" entering={FadeIn.duration(220)} style={styles.viewRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{(greetingName(userName)[0] || '?').toUpperCase()}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {prettyName(userName)}
            </Text>
            <Text style={styles.sub}>Good morning, {greetingName(userName)} ☀️</Text>
          </View>
          <PressableScale onPress={startEdit} style={[styles.iconButton, { backgroundColor: colors.surfaceSunken }]} accessibilityLabel="Edit name">
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
          </PressableScale>
          <PressableScale onPress={remove} style={[styles.iconButton, { backgroundColor: colors.surfaceSunken }]} accessibilityLabel="Remove name">
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
          </PressableScale>
        </Animated.View>
      )}
    </Card>
  );
};

const SavedBadge: React.FC = () => {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.saved, { backgroundColor: `${colors.success}1F` }]}>
      <MaterialCommunityIcons name="check-circle" size={13} color={colors.success} />
      <Text style={[styles.savedText, { color: colors.success }]}>Saved</Text>
    </Animated.View>
  );
};

const makeStyles = ({ colors, fonts, spacing, radius }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    input: {
      fontFamily: fonts.medium,
      fontSize: 17,
      color: colors.text,
      paddingHorizontal: spacing.md,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSunken,
      borderWidth: 1,
      borderColor: colors.border,
      outlineStyle: 'none',
    } as any,
    hint: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    ghost: {
      backgroundColor: colors.surfaceSunken,
    },
    ghostText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      color: colors.textSecondary,
    },
    buttonText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
    },
    viewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: fonts.bold,
      fontSize: 19,
    },
    name: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      color: colors.text,
    },
    sub: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 1,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saved: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    savedText: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
    },
  });
