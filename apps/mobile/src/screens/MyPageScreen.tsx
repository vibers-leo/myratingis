import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

interface Props {
  onNavigate: (path: string) => void;
}

export default function MyPageScreen({ onNavigate }: Props) {
  const { user, userProfile, isAuthenticated, loginWithToss, logout, loading: authLoading } = useAuth();
  const [myRatings, setMyRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) fetchMyRatings(); }, [user?.id]);

  const fetchMyRatings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('ProjectRating')
        .select('*, projects:project_id(id, title, thumbnail_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20);
      setMyRatings(data || []);
    } catch (e) { console.error('Failed to fetch ratings:', e); }
    finally { setLoading(false); }
  };

  if (authLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginEmoji}>👤</Text>
        <Text style={styles.loginTitle}>로그인이 필요합니다</Text>
        <Text style={styles.loginDesc}>토스 로그인으로 간편하게 시작하세요</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={loginWithToss}>
          <Text style={styles.loginBtnText}>토스로 로그인</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = userProfile?.display_name || userProfile?.full_name || user?.email?.split('@')[0] || '사용자';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsNumber}>{myRatings.length}</Text>
        <Text style={styles.statsLabel}>참여한 평가</Text>
      </View>

      <Text style={styles.sectionTitle}>나의 평가 내역</Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : myRatings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>📝</Text>
          <Text style={styles.emptyText}>아직 참여한 평가가 없습니다</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => onNavigate('/')}>
            <Text style={styles.ctaBtnText}>평가 참여하러 가기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        myRatings.map((rating) => (
          <TouchableOpacity key={rating.id} style={styles.ratingItem}
            onPress={() => onNavigate(`/report/${rating.project_id}`)} activeOpacity={0.7}>
            {rating.projects?.thumbnail_url ? (
              <Image source={{ uri: rating.projects.thumbnail_url }} style={styles.ratingThumb} />
            ) : (
              <View style={styles.ratingThumbPlaceholder}><Text style={{ fontSize: 20 }}>📋</Text></View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ratingTitle} numberOfLines={1}>{rating.projects?.title || '프로젝트'}</Text>
              <Text style={styles.ratingDate}>{new Date(rating.created_at).toLocaleDateString('ko-KR')}</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{rating.overall || '-'}점</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.logoutBtn}
        onPress={() => Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: logout },
        ])}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.base, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginEmoji: { fontSize: 48, marginBottom: Spacing.base },
  loginTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, marginBottom: Spacing.sm },
  loginDesc: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.tossBlue },
  loginBtnText: { color: Colors.white, fontSize: 15, fontWeight: FontWeight.extrabold },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, padding: Spacing.lg, backgroundColor: Colors.bgSecondary, borderRadius: Radius.lg, marginBottom: Spacing.xl },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontSize: 24, fontWeight: FontWeight.black },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  profileEmail: { fontSize: FontSize.md, color: Colors.textSecondary },
  statsCard: { alignItems: 'center', padding: Spacing.base, backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, marginBottom: Spacing.xl },
  statsNumber: { fontSize: 24, fontWeight: FontWeight.black, color: Colors.primary },
  statsLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: Spacing.base },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  ctaBtn: { marginTop: Spacing.base, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.sm, backgroundColor: Colors.primary },
  ctaBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  ratingItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 14, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  ratingThumb: { width: 48, height: 48, borderRadius: 8 },
  ratingThumbPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.bgSecondary, justifyContent: 'center', alignItems: 'center' },
  ratingTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  ratingDate: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.primaryLight },
  scoreText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.primary },
  logoutBtn: { marginTop: Spacing.xxl, paddingVertical: 14, alignItems: 'center' },
  logoutText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
});
