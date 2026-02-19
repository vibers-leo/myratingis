import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.base * 2 - CARD_GAP) / 2;

interface Project {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  thumbnail_url?: string;
  views_count: number;
  likes_count: number;
  category_name?: string;
  created_at: string;
  custom_data?: any;
}

type Filter = 'latest' | 'popular';

interface Props {
  onNavigate: (path: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('latest');

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
    fetchProjects();
  }, [fetchProjects]);

  const isNew = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // 7일 이내
  };

  const renderCard = (project: Project, index: number) => (
    <TouchableOpacity
      key={project.id}
      style={[styles.card, index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 }]}
      onPress={() => onNavigate(`/project/${project.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {project.thumbnail_url ? (
          <Image source={{ uri: project.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
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
      </View>

      <View style={styles.cardBody}>
        {project.category_name ? (
          <Text style={styles.categoryText} numberOfLines={1}>{project.category_name}</Text>
        ) : null}
        <Text style={styles.cardTitle} numberOfLines={2}>{project.title}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={11} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{project.views_count || 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="heart" size={11} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{project.likes_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>MYRATINGIS</Text>
          <Text style={styles.headerTitle}>
            프로젝트를 평가하고{'\n'}리워드를 받으세요
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="restaurant" size={28} color={Colors.primary} />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['latest', 'popular'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Ionicons
              name={f === 'latest' ? 'time-outline' : 'trending-up'}
              size={14}
              color={filter === f ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'latest' ? '최신순' : '인기순'}
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
            <Ionicons name="search-outline" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>등록된 프로젝트가 없습니다</Text>
          <Text style={styles.emptyDesc}>새로운 프로젝트가 등록되면 알려드릴게요</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {projects.map((project, index) => renderCard(project, index))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: Spacing.xxxl },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.text,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgTertiary,
  },
  filterBtnActive: {
    backgroundColor: Colors.text,
  },
  filterText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  filterTextActive: { color: Colors.white },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    marginBottom: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.bgTertiary,
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  newBadge: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeight.black,
    letterSpacing: 0.5,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  hotBadgeText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: FontWeight.black,
  },

  // Card Body
  cardBody: {
    padding: Spacing.sm,
    paddingTop: 10,
    paddingBottom: Spacing.md,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
    color: Colors.text,
    lineHeight: 19,
    letterSpacing: -0.3,
    marginBottom: 6,
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
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
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
