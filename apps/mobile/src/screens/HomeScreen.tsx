import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator, StyleSheet, Dimensions,
  Animated, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEB_BASE = 'https://myratingis.kr';

function optimizeImageUrl(url: string | undefined | null, width = 600): string | null {
  if (!url) return null;
  if (url.includes('supabase.co/storage/v1/object/public')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
  }
  return url;
}

interface Project {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  thumbnail_url?: string;
  site_url?: string;
  views_count: number;
  likes_count: number;
  category_name?: string;
  created_at: string;
  custom_data?: any;
  owner_name?: string;
  audit_deadline?: string;
}

type Filter = 'all' | 'latest' | 'popular';

interface Props {
  onNavigate: (path: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const fetchProjects = useCallback(async () => {
    try {
      let query = (supabase as any)
        .from('projects')
        .select('*')
        .eq('visibility', 'public')
        .limit(30);

      if (filter === 'popular') {
        query = query.order('views_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const auditProjects = (data || []).filter((p: any) =>
        p.custom_data?.audit_config || p.type === 'audit'
      );
      setProjects(auditProjects);
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setImageErrors(new Set());
    fetchProjects();
  }, [fetchProjects]);

  const isNew = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  const getDday = (deadline?: string) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-DAY';
    return `D-${diff}`;
  };

  const handleImageError = (projectId: string) => {
    setImageErrors(prev => new Set(prev).add(projectId));
  };

  const renderCard = (project: Project) => {
    const imageUrl = optimizeImageUrl(project.thumbnail_url);
    const hasImageError = imageErrors.has(project.id);
    const deadline = project.audit_deadline || project.custom_data?.audit_config?.deadline;
    const dday = getDday(deadline);

    return (
      <TouchableOpacity
        key={project.id}
        style={styles.card}
        onPress={() => onNavigate(`/project/${project.id}`)}
        activeOpacity={0.85}
      >
        {/* Thumbnail */}
        <View style={styles.imageContainer}>
          {imageUrl && !hasImageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => handleImageError(project.id)}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="restaurant-outline" size={32} color={Colors.primaryDark} />
              <Text style={styles.placeholderText}>REVIEW</Text>
            </View>
          )}

          {/* Badges */}
          <View style={styles.badgeContainer}>
            {isNew(project.created_at) && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {(project.views_count || 0) > 50 && (
              <View style={styles.hotBadge}>
                <Ionicons name="flame" size={10} color="#92400E" />
                <Text style={styles.hotBadgeText}>HOT</Text>
              </View>
            )}
          </View>

          {/* D-day badge */}
          {dday && (
            <View style={[styles.ddayBadge, dday === '마감' && styles.ddayExpired]}>
              <Text style={[styles.ddayText, dday === '마감' && styles.ddayTextExpired]}>{dday}</Text>
            </View>
          )}
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {project.category_name ? (
            <Text style={styles.categoryText} numberOfLines={1}>{project.category_name}</Text>
          ) : null}
          <Text style={styles.cardTitle} numberOfLines={2}>{project.title}</Text>
          {(project.summary || project.description) ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{project.summary || project.description}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{project.views_count || 0}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="heart" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{project.likes_count || 0}</Text>
            </View>
            {project.owner_name ? (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={12} color={Colors.textTertiary} />
                <Text style={styles.metaText}>{project.owner_name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroBg}>
          <View style={styles.heroGlow} />
        </View>

        <View style={styles.heroBadge}>
          <Ionicons name="star" size={12} color={Colors.primary} />
          <Text style={styles.heroBadgeText}>전문 평가 플랫폼</Text>
        </View>

        <Image
          source={{ uri: `${WEB_BASE}/myratingis-logo.png` }}
          style={styles.heroLogo}
          resizeMode="contain"
        />

        <Text style={styles.heroSlogan}>
          전문평가위원과 잠재고객의 날카로운 시선으로{'\n'}
          여러분의 프로젝트가 가진 진짜 가치를 증명해 드립니다
        </Text>

        <Image
          source={{ uri: `${WEB_BASE}/review/cloche-cover.png` }}
          style={styles.heroCloche}
          resizeMode="contain"
        />

        <View style={styles.heroCtas}>
          <TouchableOpacity style={styles.heroCtaPrimary} activeOpacity={0.85}>
            <Ionicons name="restaurant" size={18} color={Colors.white} />
            <Text style={styles.heroCtaPrimaryText}>평가 의뢰하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroCtaSecondary}
            activeOpacity={0.85}
            onPress={() => {/* scroll to projects */}}
          >
            <Ionicons name="star-outline" size={18} color={Colors.white} />
            <Text style={styles.heroCtaSecondaryText}>평가 참여하기</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary links */}
        <View style={styles.heroLinks}>
          <Text style={styles.heroLinkText}>서비스 소개</Text>
          <Text style={styles.heroLinkDot}>·</Text>
          <Text style={styles.heroLinkText}>고객 지원 · FAQ</Text>
        </View>
      </View>

      {/* Auth Banner (비로그인시) */}
      {!isAuthenticated && (
        <View style={styles.authBanner}>
          <View style={styles.authBannerIcon}>
            <Ionicons name="restaurant" size={24} color="rgba(255,255,255,0.3)" />
          </View>
          <View style={styles.authBannerContent}>
            <View style={styles.authBannerTitleRow}>
              <Ionicons name="sparkles" size={16} color={Colors.white} />
              <Text style={styles.authBannerTitle}>평가 의뢰하기</Text>
            </View>
            <Text style={styles.authBannerDesc}>
              로그인하고 프로젝트를 평가받아보세요
            </Text>
          </View>
          <View style={styles.authBannerBtns}>
            <TouchableOpacity
              style={styles.authBannerLoginBtn}
              onPress={() => onNavigate('/mypage')}
              activeOpacity={0.85}
            >
              <Text style={styles.authBannerLoginText}>로그인하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionBadge}>
            <Ionicons name="restaurant" size={12} color={Colors.primary} />
            <Text style={styles.sectionBadgeText}>진행 중인 평가 의뢰</Text>
          </View>
          <Text style={styles.sectionTitle}>평가 참여하기</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'latest', 'popular'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'ALL' : f === 'latest' ? 'LATEST' : 'POPULAR'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="restaurant-outline" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>등록된 평가가 없습니다</Text>
          <Text style={styles.emptyDesc}>새로운 프로젝트가 등록되면 알려드릴게요</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {projects.map((project) => renderCard(project))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: Spacing.xxxl },

  // Hero Section
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryGlow,
    opacity: 0.3,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  heroBadgeText: {
    ...Typography.badgeText,
    color: Colors.primary,
  },
  heroLogo: {
    width: SCREEN_WIDTH * 0.55,
    height: 48,
    marginBottom: Spacing.md,
  },
  heroSlogan: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  heroCloche: {
    width: 160,
    height: 160,
    marginBottom: Spacing.xl,
  },
  heroCtas: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.sm,
  },
  heroCtaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadow.orange,
  },
  heroCtaPrimaryText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  heroCtaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: 0,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadow.bevelCta,
  },
  heroCtaSecondaryText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  heroLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  heroLinkText: {
    ...Typography.metaLabel,
    color: Colors.text,
    opacity: 0.2,
  },
  heroLinkDot: {
    fontSize: 10,
    color: Colors.text,
    opacity: 0.2,
  },

  // Auth Banner
  authBanner: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.orange,
  },
  authBannerIcon: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
  },
  authBannerContent: {
    marginBottom: Spacing.base,
  },
  authBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authBannerTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
  },
  authBannerDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
  },
  authBannerBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  authBannerLoginBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  authBannerLoginText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.base,
  },
  sectionHeaderLeft: {},
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  sectionBadgeText: {
    ...Typography.metaLabel,
    color: Colors.primary,
  },
  sectionTitle: {
    ...Typography.heroTitle,
    fontSize: 24,
    color: Colors.text,
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgSecondary,
    marginLeft: Spacing.base,
    marginRight: Spacing.base,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
    alignSelf: 'flex-start',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 2,
  },
  filterBtnActive: {
    backgroundColor: Colors.text,
  },
  filterText: {
    ...Typography.metaLabel,
    color: Colors.textTertiary,
  },
  filterTextActive: {
    color: Colors.white,
  },

  // List (1열)
  list: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },

  // Card (풀너비)
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: Colors.bgTertiary,
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: FontWeight.black,
    color: Colors.primaryDark,
    letterSpacing: 3,
    opacity: 0.6,
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: 4,
  },
  newBadge: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  hotBadgeText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  ddayBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  ddayExpired: {
    backgroundColor: Colors.textTertiary,
  },
  ddayText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  ddayTextExpired: {
    color: Colors.white,
  },

  // Card Body
  cardBody: {
    padding: Spacing.base,
    flex: 1,
  },
  categoryText: {
    ...Typography.metaLabel,
    color: Colors.primary,
    marginBottom: 4,
  },
  cardTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  cardArrow: {
    position: 'absolute',
    right: Spacing.base,
    top: '50%',
    marginTop: 40,
  },

  // States
  center: { paddingVertical: 80, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
});
