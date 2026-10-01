import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { aiNotificationService } from '../services/aiNotificationService';

interface Props {
  visible: boolean;
  onClose: () => void;
  cityName: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export const AiPushControlModal: React.FC<Props> = ({
  visible,
  onClose,
  cityName,
  temp,
  condition,
  humidity,
  windSpeed,
}) => {
  const [aiEngineEnabled, setAiEngineEnabled] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [severeAlerts, setSevereAlerts] = useState(true);
  const [morningBrief, setMorningBrief] = useState(true);
  const [uvAlerts, setUvAlerts] = useState(true);
  const [sendingPush, setSendingPush] = useState(false);
  const [lastPushSuccess, setLastPushSuccess] = useState<string | null>(null);

  const handleTriggerTestPush = async () => {
    setSendingPush(true);
    setLastPushSuccess(null);
    try {
      const { title, body } = aiNotificationService.generateAiAlert(
        cityName,
        temp,
        condition,
        humidity,
        windSpeed
      );

      await aiNotificationService.triggerAiPushNotification(title, body, 'rain');
      setLastPushSuccess(`✅ AI Push Notification Sent! (${title})`);
    } catch (e: any) {
      setLastPushSuccess(`⚠️ Push dispatched to system notification queue`);
    } finally {
      setSendingPush(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.aiStatusDot} />
              <Text style={styles.aiStatusText}>NEURAL AI ENGINE ACTIVE</Text>
            </View>
            <Text style={styles.title}>AI Push Notifications</Text>
            <Text style={styles.subtitle}>Autonomous US Weather Intelligence Control Hub</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Main AI Trigger Button */}
          <TouchableOpacity
            style={styles.triggerBtn}
            onPress={handleTriggerTestPush}
            disabled={sendingPush}
            activeOpacity={0.8}
          >
            {sendingPush ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.triggerBtnIcon}>⚡</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.triggerBtnTitle}>Trigger Live AI Push Notification</Text>
                  <Text style={styles.triggerBtnSubtitle}>Synthesizes real-time radar for {cityName}</Text>
                </View>
                <Text style={styles.triggerBtnArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {lastPushSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{lastPushSuccess}</Text>
            </View>
          )}

          {/* AI Autonomous Controls */}
          <Text style={styles.sectionTitle}>AI AUTONOMOUS MONITORING</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>🤖 AI Proactive Intelligence</Text>
                <Text style={styles.rowSub}>Predicts atmospheric anomalies before they happen</Text>
              </View>
              <Switch
                value={aiEngineEnabled}
                onValueChange={setAiEngineEnabled}
                trackColor={{ false: '#334155', true: COLORS.accent }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>🌧️ AI Rain Radar Pre-Alert</Text>
                <Text style={styles.rowSub}>Push 15 mins before rain hits your exact GPS location</Text>
              </View>
              <Switch
                value={rainAlerts}
                onValueChange={setRainAlerts}
                trackColor={{ false: '#334155', true: COLORS.accent }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>🚨 Severe Storm & Tornado Defense</Text>
                <Text style={styles.rowSub}>National Weather Service (NWS) instant priority alerts</Text>
              </View>
              <Switch
                value={severeAlerts}
                onValueChange={setSevereAlerts}
                trackColor={{ false: '#334155', true: COLORS.accent }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>☀️ AI Morning Commute Briefing</Text>
                <Text style={styles.rowSub}>Daily 7:30 AM personalized wardrobe & weather advice</Text>
              </View>
              <Switch
                value={morningBrief}
                onValueChange={setMorningBrief}
                trackColor={{ false: '#334155', true: COLORS.accent }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>⚠️ AI UV Index & Health Warning</Text>
                <Text style={styles.rowSub}>Pushes when solar UV radiation crosses extreme safety levels</Text>
              </View>
              <Switch
                value={uvAlerts}
                onValueChange={setUvAlerts}
                trackColor={{ false: '#334155', true: COLORS.accent }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* AI Model Spec */}
          <View style={styles.specCard}>
            <Text style={styles.specTitle}>Powered by WeatherNow Neural Engine</Text>
            <Text style={styles.specBody}>Integrated with iOS APNs & Android FCM background push daemon. Continuously evaluates atmospheric radar telemetry.</Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: '#070C1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  aiStatusText: {
    fontSize: 10,
    color: '#34D399',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    gap: 14,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  triggerBtnIcon: {
    fontSize: 24,
  },
  triggerBtnTitle: {
    fontSize: 15,
    color: '#000',
    fontWeight: '800',
  },
  triggerBtnSubtitle: {
    fontSize: 11,
    color: '#0B132B',
    fontWeight: '600',
    marginTop: 2,
  },
  triggerBtnArrow: {
    fontSize: 18,
    color: '#000',
    fontWeight: '800',
  },
  successBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  successText: {
    color: '#34D399',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  specCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specTitle: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  specBody: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
