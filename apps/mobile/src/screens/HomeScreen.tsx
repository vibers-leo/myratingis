import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <Text style={styles.subtitle}>프로젝트를 평가하고 리워드를 받으세요</Text>

      <View style={styles.filterRow}>
        {(['latest', 'popular'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'latest' ? '최신순' : '인기순'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyText}>등록된 프로젝트가 없습니다</Text>
        </View>
      ) : (
        projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={styles.card}
            onPress={() => onNavigate(`/project/${project.id}`)}
            activeOpacity={0.7}
          >
            {project.thumbnail_url ? (
              <Image source={{ uri: project.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
            ) : null}
            <View style={styles.cardContent}>
              {project.category_name ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{project.category_name}</Text>
                </View>
              ) : null}
              <Text style={styles.cardTitle} numberOfLines={2}>{project.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {project.summary || project.description || ''}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>👀 {project.views_count || 0}</Text>
                <Text style={styles.metaText}>❤️ {project.likes_count || 0}</Text>
                <Text style={styles.metaDate}>
                  {new Date(project.created_at).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginBottom: Spacing.lg },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  filterBtn: { paddingHorizontal: 18, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.bgSecondary },
  filterBtnActive: { backgroundColor: Colors.text },
  filterText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  center: { paddingVertical: 60, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontWeight: FontWeight.bold, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.base },
  thumbnail: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.bgSecondary },
  cardContent: { padding: Spacing.base },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, backgroundColor: Colors.primaryLight, borderRadius: 6, marginBottom: Spacing.sm },
  categoryText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.primary },
  cardTitle: { fontSize: 17, fontWeight: FontWeight.extrabold, lineHeight: 22, marginBottom: 6, color: Colors.text },
  cardDesc: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  cardMeta: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  metaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  metaDate: { fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 'auto' },
});
