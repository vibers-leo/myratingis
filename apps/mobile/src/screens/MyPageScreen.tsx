import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, StyleSheet, TextInput, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow, Typography } from '@/constants/theme';

function optimizeImageUrl(url: string | undefined | null, width = 200): string | null {
  if (!url) return null;
  if (url.includes('supabase.co/storage/v1/object/public')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
  }
  return url;
}

interface Props {
  onNavigate: (path: string) => void;
}

export default function MyPageScreen({ onNavigate }: Props) {
  const { user, userProfile, isAuthenticated, loginWithToss, loginWithEmail, logout, loading: authLoading } = useAuth();
  const [myRatings, setMyRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoginLoading(true);
    await loginWithEmail(email.trim(), password);
    setLoginLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'myratingis://auth/callback',
        },
      });
      if (error) throw error;
      if (data?.url) {
        await Linking.openURL(data.url);
      }
    } catch (e) {
      console.error('Google login failed:', e);
      Alert.alert('로그인 실패', 'Google 로그인에 실패했습니다.');
    }
  };

  if (authLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.loginContent}>
        <View style={styles.loginHeader}>
          <View style={styles.loginIcon}>
            <Ionicons name="restaurant" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.loginBrand}>MYRATINGIS</Text>
          <Text style={styles.loginTitle}>로그인</Text>
          <Text style={styles.loginDesc}>프로젝트를 평가하고 리워드를 받으세요</Text>
        </View>

        {/* Email Login Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>이메일</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="이메일을 입력하세요"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>비밀번호</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.emailLoginBtn, loginLoading && { opacity: 0.7 }]}
            onPress={handleEmailLogin}
            disabled={loginLoading}
            activeOpacity={0.85}
          >
            {loginLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.emailLoginBtnText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialLoginSection}>
          <TouchableOpacity style={styles.googleLoginBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
            <Ionicons name="logo-google" size={18} color={Colors.white} />
            <Text style={styles.googleLoginBtnText}>Google로 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tossLoginBtn} onPress={loginWithToss} activeOpacity={0.85}>
            <Text style={styles.tossLoginBtnText}>토스로 로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const displayName = userProfile?.display_name || userProfile?.full_name || user?.email?.split('@')[0] || '사용자';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myRatings.length}</Text>
            <Text style={styles.statLabel}>참여한 평가</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {myRatings.length > 0
                ? (myRatings.reduce((sum, r) => sum + (r.overall || 0), 0) / myRatings.length).toFixed(1)
                : '-'}
            </Text>
            <Text style={styles.statLabel}>평균 점수</Text>
          </View>
        </View>
      </View>

      {/* My Ratings */}
      <View style={styles.ratingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 평가 내역</Text>
          <Text style={styles.sectionCount}>{myRatings.length}개</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBlock}><ActivityIndicator color={Colors.primary} /></View>
        ) : myRatings.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>아직 참여한 평가가 없습니다</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('/')} activeOpacity={0.85}>
              <Ionicons name="search" size={16} color={Colors.white} />
              <Text style={styles.emptyBtnText}>평가 참여하러 가기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myRatings.map((rating) => (
            <TouchableOpacity key={rating.id} style={styles.ratingItem}
              onPress={() => onNavigate(`/report/${rating.project_id}`)} activeOpacity={0.8}>
              {rating.projects?.thumbnail_url ? (
                <Image source={{ uri: optimizeImageUrl(rating.projects.thumbnail_url) || rating.projects.thumbnail_url }} style={styles.ratingThumb} />
              ) : (
                <View style={styles.ratingThumbPlaceholder}>
                  <Ionicons name="image-outline" size={18} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.ratingContent}>
                <Text style={styles.ratingTitle} numberOfLines={1}>{rating.projects?.title || '프로젝트'}</Text>
                <Text style={styles.ratingDate}>{new Date(rating.created_at).toLocaleDateString('ko-KR')}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{rating.overall || '-'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn}
        onPress={() => Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: logout },
        ])}>
        <Ionicons name="log-out-outline" size={18} color={Colors.textTertiary} />
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSecondary },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },

  // Login Screen
  loginContent: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  loginHeader: { alignItems: 'center', marginBottom: Spacing.xxl },
  loginIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.base,
  },
  loginBrand: {
    ...Typography.metaLabel,
    letterSpacing: 4,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  loginTitle: { fontSize: FontSize.title, fontWeight: FontWeight.black, color: Colors.text, marginBottom: Spacing.sm },
  loginDesc: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },

  // Form
  formSection: { marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.base },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bgSecondary,
    overflow: 'hidden',
  },
  inputIcon: { marginLeft: Spacing.base },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  emailLoginBtn: {
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadow.orange,
  },
  emailLoginBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.base, fontSize: FontSize.sm, color: Colors.textTertiary },

  // Social Login
  socialLoginSection: {
    gap: Spacing.sm,
  },
  googleLoginBtn: {
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.google,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  googleLoginBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
  },
  tossLoginBtn: {
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.tossBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tossLoginBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.black },

  // Profile Section
  profileSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: FontWeight.black },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.text,
    fontStyle: 'italic',
  },
  profileEmail: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center', alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text, fontStyle: 'italic' },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // Rating Section
  ratingSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.text },
  sectionCount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textTertiary },

  // Loading / Empty
  loadingBlock: { paddingVertical: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.bgTertiary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: Spacing.base },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    ...Shadow.orange,
  },
  emptyBtnText: { color: Colors.white, fontWeight: FontWeight.black, fontSize: FontSize.base },

  // Rating Item
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  ratingThumb: { width: 44, height: 44, borderRadius: Radius.sm },
  ratingThumbPlaceholder: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: Colors.bgTertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  ratingContent: { flex: 1, minWidth: 0 },
  ratingTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  ratingDate: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  scoreBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  scoreText: { fontSize: FontSize.md, fontWeight: FontWeight.black, color: Colors.primary },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  logoutText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
});
