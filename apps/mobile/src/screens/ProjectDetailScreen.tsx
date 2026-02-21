import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, StyleSheet, Dimensions, Animated, Pressable, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function optimizeImageUrl(url: string | undefined | null, width = 800): string | null {
  if (!url) return null;
  if (url.includes('supabase.co/storage/v1/object/public')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
  }
  return url;
}

interface Props {
  id: string;
  onNavigate: (path: string) => void;
}

export default function ProjectDetailScreen({ id, onNavigate }: Props) {
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);
  const [ratingCount, setRatingCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Animation refs for social buttons
  const likeScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const shareScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, user?.id]);

  const fetchProject = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      setProject(data);
      setLikeCount(data?.likes_count || 0);

      const { count } = await (supabase as any)
        .from('ProjectRating')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);
      setRatingCount(count || 0);

      if (user) {
        const [ratingRes, likeRes] = await Promise.all([
          (supabase as any).from('ProjectRating').select('id')
            .eq('project_id', projectId).eq('user_id', user.id).limit(1).single(),
          (supabase as any).from('project_likes').select('id')
            .eq('project_id', projectId).eq('user_id', user.id).single(),
        ]);
        setHasRated(!!ratingRes.data);
        setIsLiked(!likeRes.error && !!likeRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch project:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    // Animate
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 0.8, useNativeDriver: true, speed: 50 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 12 }),
    ]).start();

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        await (supabase as any).from('project_likes')
          .delete().eq('project_id', id).eq('user_id', user.id);
      } else {
        await (supabase as any).from('project_likes')
          .insert({ project_id: id, user_id: user.id });
      }
    } catch (e) {
      // Rollback
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleShare = async () => {
    Animated.sequence([
      Animated.spring(shareScale, { toValue: 0.8, useNativeDriver: true, speed: 50 }),
      Animated.spring(shareScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    try {
      await Share.share({
        message: `${project?.title} - 제 평가는요?\nhttps://myratingis.kr/project/${id}`,
      });
    } catch (e) {}
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!project) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        </View>
        <Text style={styles.errorTitle}>프로젝트를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const auditConfig = project.custom_data?.audit_config;
  const deadline = project.audit_deadline || auditConfig?.deadline;
  const isExpired = deadline ? new Date(deadline) < new Date() : false;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        {project.thumbnail_url ? (
          <View style={styles.heroContainer}>
            <Image source={{ uri: optimizeImageUrl(project.thumbnail_url) || project.thumbnail_url }} style={styles.heroImage} resizeMode="cover" />
            {project.category_name ? (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{project.category_name}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Social Action Bar */}
        <View style={styles.socialBar}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Pressable style={[styles.socialBtn, isLiked && styles.socialBtnLiked]} onPress={handleLike}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#EF4444' : Colors.textSecondary} />
              <Text style={[styles.socialCount, isLiked && { color: '#EF4444' }]}>{likeCount}</Text>
            </Pressable>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
            <Pressable style={styles.socialBtn} onPress={() => {
              Animated.sequence([
                Animated.spring(bookmarkScale, { toValue: 0.8, useNativeDriver: true, speed: 50 }),
                Animated.spring(bookmarkScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
              ]).start();
            }}>
              <Ionicons name="bookmark-outline" size={18} color={Colors.textSecondary} />
            </Pressable>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: shareScale }] }}>
            <Pressable style={styles.socialBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.body}>
          {/* Title Section */}
          <Text style={styles.title}>{project.title}</Text>
          {(project.summary || project.description) ? (
            <Text style={styles.description}>{project.summary || project.description}</Text>
          ) : null}

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people" size={18} color={Colors.completeness} />
              </View>
              <Text style={styles.statNumber}>{ratingCount}</Text>
              <Text style={styles.statLabel}>평가 참여</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="eye" size={18} color={Colors.aesthetics} />
              </View>
              <Text style={styles.statNumber}>{project.views_count || 0}</Text>
              <Text style={styles.statLabel}>조회수</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="heart" size={18} color={Colors.marketability} />
              </View>
              <Text style={styles.statNumber}>{likeCount}</Text>
              <Text style={styles.statLabel}>좋아요</Text>
            </View>
          </View>

          {/* Deadline */}
          {deadline ? (
            <View style={[styles.deadlineCard, isExpired && styles.deadlineExpired]}>
              <Ionicons
                name={isExpired ? 'time' : 'calendar-outline'}
                size={18}
                color={isExpired ? Colors.error : Colors.primary}
              />
              <Text style={[styles.deadlineText, isExpired && styles.deadlineTextExpired]}>
                {isExpired ? '평가가 마감되었습니다' : `마감일: ${new Date(deadline).toLocaleDateString('ko-KR')}`}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={styles.ctaContainer}>
        {hasRated ? (
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaBtnSuccess]}
            onPress={() => onNavigate(`/report/${id}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="bar-chart" size={20} color={Colors.white} />
            <Text style={styles.ctaBtnText}>평가 결과 보기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, isExpired ? styles.ctaBtnDisabled : styles.ctaBtnPrimary]}
            onPress={() => onNavigate(`/review/${id}`)}
            disabled={isExpired}
            activeOpacity={0.85}
          >
            <Ionicons name="restaurant" size={20} color={isExpired ? Colors.textTertiary : Colors.white} />
            <Text style={[styles.ctaBtnText, isExpired && styles.ctaBtnTextDisabled]}>
              {isExpired ? '마감된 평가입니다' : '평가 시작하기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorIcon: { marginBottom: Spacing.md },
  errorTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary },

  // Hero
  heroContainer: { position: 'relative' },
  heroImage: { width: SCREEN_WIDTH, aspectRatio: 16 / 9, backgroundColor: Colors.bgTertiary },
  heroBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Social Action Bar
  socialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  socialBtnLiked: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  socialCount: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },

  // Body
  body: { padding: Spacing.lg, paddingTop: Spacing.lg },
  title: {
    ...Typography.sectionTitle,
    fontStyle: 'italic',
    lineHeight: 30,
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Deadline
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.1)',
  },
  deadlineExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  deadlineText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  deadlineTextExpired: { color: Colors.error },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: Spacing.lg,
    paddingBottom: 34,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaBtn: {
    height: 56,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctaBtnPrimary: {
    backgroundColor: Colors.primary,
    ...Shadow.orange,
  },
  ctaBtnSuccess: {
    backgroundColor: Colors.success,
    ...Shadow.md,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.bgTertiary,
    borderColor: Colors.border,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  ctaBtnTextDisabled: {
    color: Colors.textTertiary,
    fontStyle: 'normal',
    textTransform: 'none',
  },
});
