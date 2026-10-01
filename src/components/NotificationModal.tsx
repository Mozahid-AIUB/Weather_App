import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants';

export interface WeatherNotification {
  id: string;
  title: string;
  message: string;
  type: 'severe' | 'rain' | 'uv' | 'daily' | 'air';
  time: string;
  isRead: boolean;
  severity?: 'critical' | 'warning' | 'info';
}

const INITIAL_NOTIFICATIONS: WeatherNotification[] = [
  {
    id: '1',
    title: '🚨 Severe Storm Watch (NWS)',
    message: 'National Weather Service has issued a Severe Thunderstorm Watch for the coastal metro area until 8:30 PM EST. Wind gusts up to 45 mph.',
    type: 'severe',
    severity: 'critical',
    time: '12m ago',
    isRead: false,
  },
  {
    id: '2',
    title: '🌧️ Rain Starting Soon',
    message: 'Precipitation radar indicates light showers will begin in approximately 15 minutes. Expected duration: 40 mins.',
    type: 'rain',
    severity: 'warning',
    time: '34m ago',
    isRead: false,
  },
  {
    id: '3',
    title: '☀️ High UV Index Advisory',
    message: 'UV Index is expected to reach 8 (Very High) around 1:00 PM. SPF 30+ sunscreen and shade recommended for outdoor activities.',
    type: 'uv',
    severity: 'info',
    time: '2h ago',
    isRead: true,
  },
  {
    id: '4',
    title: '🌤️ Daily Morning Briefing',
    message: 'Good morning! Today will be partly cloudy with a high of 78°F and a gentle breeze from the NE. Great weather for running.',
    type: 'daily',
    severity: 'info',
    time: '5h ago',
    isRead: true,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onMarkAllRead?: () => void;
}

export const NotificationModal: React.FC<Props> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<WeatherNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts' | 'daily'>('all');

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markItemRead = (id: string) => {
    setNotifications(notifications.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'alerts') return n.type === 'severe' || n.type === 'rain';
    if (activeFilter === 'daily') return n.type === 'daily' || n.type === 'uv' || n.type === 'air';
    return true;
  });

  const getBorderColor = (severity?: string) => {
    if (severity === 'critical') return 'rgba(239, 68, 68, 0.4)';
    if (severity === 'warning') return 'rgba(245, 158, 11, 0.4)';
    return 'rgba(255, 255, 255, 0.08)';
  };

  const getBadgeColor = (severity?: string) => {
    if (severity === 'critical') return '#EF4444';
    if (severity === 'warning') return '#F59E0B';
    return COLORS.accent;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>In-App Notifications</Text>
            <Text style={styles.subtitle}>US Weather Alerts & Advisories</Text>
          </View>
          <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead}>
            <Text style={styles.readAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All ({notifications.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'alerts' && styles.filterChipActive]}
            onPress={() => setActiveFilter('alerts')}
          >
            <Text style={[styles.filterText, activeFilter === 'alerts' && styles.filterTextActive]}>🚨 Severe Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'daily' && styles.filterChipActive]}
            onPress={() => setActiveFilter('daily')}
          >
            <Text style={[styles.filterText, activeFilter === 'daily' && styles.filterTextActive]}>☀️ Daily Briefs</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                { borderColor: getBorderColor(item.severity) },
                !item.isRead && styles.unreadCard,
              ]}
              onPress={() => markItemRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: getBadgeColor(item.severity) }]} />}
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </View>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>

              <Text style={styles.itemMessage}>{item.message}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: '82%',
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
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  readAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
  },
  readAllText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  itemTitle: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  itemTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  itemMessage: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
