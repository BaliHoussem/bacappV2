import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, FlatList, Modal, Dimensions,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useNotificationCenter, SENDER_LABELS, InboxNotification } from '@/contexts/NotificationCenterContext';

const { width: SCREEN_W } = Dimensions.get('window');

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} د`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} س`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'أمس';
  if (diffDay < 7) return `منذ ${diffDay} أيام`;
  return d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-DZ', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function SenderTag({ sender, color }: { sender: string; color: string }) {
  return (
    <View style={[st.senderTag, { borderColor: `${color}30` }]}>
      <View style={[st.senderDot, { backgroundColor: color }]} />
      <Text style={[st.senderTagText, { color }]}>{SENDER_LABELS[sender as keyof typeof SENDER_LABELS]}</Text>
    </View>
  );
}

function AccentLine({ color }: { color: string }) {
  return <View style={[st.accentLine, { backgroundColor: color }]} />;
}

function DeleteModal({ visible, onCancel, onConfirm, count }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void; count: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={st.modalOverlay}>
        <Animated.View entering={ZoomIn.duration(300).springify()} style={st.modalCard}>
          <LinearGradient
            colors={['#1E1428', '#161B22']}
            style={st.modalGradient}
          >
            <View style={st.modalIconArea}>
              <View style={st.modalIconRing1}>
                <View style={st.modalIconRing2}>
                  <LinearGradient
                    colors={['#FF6B6B30', '#FF6B6B08']}
                    style={st.modalIconCenter}
                  >
                    <Ionicons name="trash" size={28} color={Colors.accent} />
                  </LinearGradient>
                </View>
              </View>
            </View>

            <Text style={st.modalTitle}>حذف جميع الإشعارات</Text>
            <Text style={st.modalDesc}>
              سيتم حذف{' '}
              <Text style={st.modalCount}>{count}</Text>
              {' '}إشعار نهائيا. لا يمكن التراجع عن هذا الإجراء.
            </Text>

            <View style={st.modalDivider} />

            <View style={st.modalActions}>
              <Pressable onPress={onCancel} style={st.modalCancelBtn}>
                <Text style={st.modalCancelText}>إلغاء</Text>
              </Pressable>
              <Pressable onPress={onConfirm} style={st.modalDeleteBtn}>
                <LinearGradient
                  colors={['#FF6B6B', '#CC4444']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={st.modalDeleteGrad}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={st.modalDeleteText}>حذف الكل</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationCenter();

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);

  const handlePress = (notif: InboxNotification) => {
    if (!notif.read) markAsRead(notif.id);
    setExpandedId(prev => prev === notif.id ? null : notif.id);
  };

  const handleClearAll = () => setDeleteModal(true);
  const confirmClear = () => { clearAll(); setDeleteModal(false); };

  const renderItem = ({ item, index }: { item: InboxNotification; index: number }) => {
    const isExpanded = expandedId === item.id;
    const isUnread = !item.read;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(450)}>
        <Pressable onPress={() => handlePress(item)} style={{ marginBottom: 12 }}>
          <View style={[st.card, isUnread && st.cardUnread]}>
            <AccentLine color={item.color} />

            <View style={st.cardInner}>
              <View style={st.cardHeader}>
                <View style={st.cardHeaderRight}>
                  <View style={st.titleRow}>
                    {isUnread && <View style={[st.unreadPulse, { backgroundColor: item.color }]} />}
                    <Text style={[st.cardTitle, isUnread && { color: Colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <SenderTag sender={item.sender} color={item.color} />
                </View>
                <View style={st.cardHeaderLeft}>
                  <Text style={st.timeText}>{formatTime(item.createdAt)}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14} color={Colors.textMuted}
                  />
                </View>
              </View>

              <Text style={st.cardBody} numberOfLines={isExpanded ? undefined : 2}>
                {item.body}
              </Text>

              {isExpanded && (
                <Animated.View entering={FadeIn.duration(300)} style={st.expandArea}>
                  {item.details && (
                    <View style={st.detailsBox}>
                      <View style={[st.detailsAccent, { backgroundColor: `${item.color}40` }]} />
                      <Text style={st.detailsText}>{item.details}</Text>
                    </View>
                  )}

                  <View style={st.metaStrip}>
                    <View style={st.metaChip}>
                      <View style={[st.metaDot, { backgroundColor: item.color }]} />
                      <Text style={st.metaChipText}>{SENDER_LABELS[item.sender as keyof typeof SENDER_LABELS]}</Text>
                    </View>
                    <View style={st.metaSep} />
                    <Text style={st.metaDate}>{formatFullDate(item.createdAt)}</Text>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={st.container}>
      <LinearGradient
        colors={['#0A0F1A', '#0F1A2E', '#0A0F1A']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[st.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 10 }]}>
        <Pressable onPress={goBack} style={st.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </Pressable>

        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>الإشعارات</Text>
          {unreadCount > 0 && (
            <View style={st.headerBadge}>
              <Text style={st.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={st.headerActions}>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} style={st.actionPill}>
              <Text style={st.actionPillText}>قراءة الكل</Text>
              <View style={st.actionPillDot} />
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable onPress={handleClearAll} style={st.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.accent} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[st.list, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={notifications.length > 0}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={st.emptyState}>
            <View style={st.emptyCircleOuter}>
              <View style={st.emptyCircleInner}>
                <View style={st.emptyLines}>
                  <View style={[st.emptyLine, { width: 28, backgroundColor: Colors.textMuted }]} />
                  <View style={[st.emptyLine, { width: 20, backgroundColor: `${Colors.textMuted}80` }]} />
                  <View style={[st.emptyLine, { width: 14, backgroundColor: `${Colors.textMuted}50` }]} />
                </View>
              </View>
            </View>
            <Text style={st.emptyTitle}>صندوق الإشعارات فارغ</Text>
            <Text style={st.emptyBody}>ستظهر هنا إشعاراتك وإنجازاتك الجديدة</Text>
          </Animated.View>
        }
      />

      <DeleteModal
        visible={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={confirmClear}
        count={notifications.length}
      />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerTitle: {
    fontSize: 19, fontFamily: 'Cairo_700Bold', color: Colors.text,
  },
  headerBadge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 20, height: 20, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 11, fontFamily: 'Cairo_700Bold', color: '#0D1117', lineHeight: 15,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderWidth: 1, borderColor: 'rgba(0, 212, 170, 0.15)',
  },
  actionPillText: {
    fontSize: 11, fontFamily: 'Cairo_600SemiBold', color: Colors.primary,
  },
  actionPillDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary,
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  list: { paddingHorizontal: 16, paddingTop: 10 },

  card: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#141B28',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardUnread: {
    backgroundColor: '#161E2E',
    borderColor: 'rgba(0, 212, 170, 0.12)',
  },
  accentLine: {
    height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    opacity: 0.7,
  },
  cardInner: { padding: 14 },
  cardHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  cardHeaderRight: { flex: 1, alignItems: 'flex-end', gap: 6 },
  titleRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
  },
  unreadPulse: {
    width: 8, height: 8, borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15, fontFamily: 'Cairo_700Bold', color: 'rgba(230, 237, 243, 0.7)',
    textAlign: 'right', flex: 1,
  },
  cardHeaderLeft: { alignItems: 'flex-start', gap: 4, marginLeft: 8 },
  timeText: {
    fontSize: 10, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },
  cardBody: {
    fontSize: 13, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary,
    textAlign: 'right', lineHeight: 21,
  },

  senderTag: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    borderWidth: 1, alignSelf: 'flex-end',
  },
  senderDot: { width: 4, height: 4, borderRadius: 2 },
  senderTagText: { fontSize: 10, fontFamily: 'Cairo_600SemiBold' },

  expandArea: { marginTop: 14 },
  detailsBox: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  detailsAccent: { width: 3, borderRadius: 2, marginLeft: 10 },
  detailsText: {
    flex: 1, fontSize: 13, fontFamily: 'Cairo_400Regular',
    color: Colors.textSecondary, textAlign: 'right', lineHeight: 22,
  },

  metaStrip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  metaChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
  },
  metaDot: { width: 5, height: 5, borderRadius: 3 },
  metaChipText: {
    fontSize: 11, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },
  metaSep: {
    width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metaDate: {
    fontSize: 11, fontFamily: 'Cairo_400Regular', color: Colors.textMuted,
  },

  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyCircleOuter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyCircleInner: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyLines: { gap: 5, alignItems: 'center' },
  emptyLine: { height: 3, borderRadius: 2 },
  emptyTitle: {
    fontSize: 17, fontFamily: 'Cairo_700Bold', color: Colors.text, marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13, fontFamily: 'Cairo_500Medium', color: Colors.textMuted,
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%', maxWidth: 340, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalGradient: {
    padding: 28, alignItems: 'center',
  },
  modalIconArea: { marginBottom: 20 },
  modalIconRing1: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, borderColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalIconRing2: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalIconCenter: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18, fontFamily: 'Cairo_700Bold', color: Colors.text,
    textAlign: 'center', marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13, fontFamily: 'Cairo_400Regular', color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  modalCount: {
    fontFamily: 'Cairo_700Bold', color: Colors.accent,
  },
  modalDivider: {
    width: '100%', height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 22,
  },
  modalActions: {
    flexDirection: 'row-reverse', gap: 12, width: '100%',
  },
  modalCancelBtn: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: Colors.textSecondary,
  },
  modalDeleteBtn: { flex: 1 },
  modalDeleteGrad: {
    height: 44, borderRadius: 14,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  modalDeleteText: {
    fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#fff',
  },
});
