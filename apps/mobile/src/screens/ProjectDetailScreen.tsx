import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

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

      const { count } = await (supabase as any)
        .from('ProjectRating')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);
      setRatingCount(count || 0);

      if (user) {
        const { data: myRating } = await (supabase as any)
          .from('ProjectRating').select('id')
          .eq('project_id', projectId).eq('user_id', user.id)
          .limit(1).single();
        setHasRated(!!myRating);
      }
    } catch (e) {
      console.error('Failed to fetch project:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
        <Text style={{ fontWeight: FontWeight.bold, color: Colors.textSecondary }}>프로젝트를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const auditConfig = project.custom_data?.audit_config;
  const deadline = project.audit_deadline || auditConfig?.deadline;
  const isExpired = deadline ? new Date(deadline) < new Date() : false;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {project.thumbnail_url ? (
          <Image source={{ uri: project.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : null}

        <View style={styles.body}>
          {project.category_name ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{project.category_name}</Text>
            </View>
          ) : null}

          <Text style={styles.title}>{project.title}</Text>
          <Text style={styles.description}>{project.summary || project.description || ''}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{ratingCount}</Text>
              <Text style={styles.statLabel}>평가 참여</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{project.views_count || 0}</Text>
              <Text style={styles.statLabel}>조회수</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{project.likes_count || 0}</Text>
              <Text style={styles.statLabel}>좋아요</Text>
            </View>
          </View>

          {deadline ? (
            <View style={[styles.deadlineBar, isExpired && styles.deadlineExpired]}>
              <Text style={[styles.deadlineText, isExpired && styles.deadlineTextExpired]}>
                {isExpired ? '⏰ 평가가 마감되었습니다' : `⏰ 마감일: ${new Date(deadline).toLocaleDateString('ko-KR')}`}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        {hasRated ? (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: Colors.success }]}
            onPress={() => onNavigate(`/report/${id}`)}
          >
            <Text style={styles.ctaBtnText}>평가 결과 보기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: isExpired ? Colors.bgTertiary : Colors.primary }]}
            onPress={() => onNavigate(`/review/${id}`)}
            disabled={isExpired}
          >
            <Text style={[styles.ctaBtnText, isExpired && { opacity: 0.5 }]}>
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
  scrollContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thumbnail: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.bgSecondary },
  body: { padding: Spacing.lg },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.primaryLight, borderRadius: 8, marginBottom: Spacing.md },
  categoryText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.primary },
  title: { fontSize: FontSize.title, fontWeight: FontWeight.black, letterSpacing: -0.5, lineHeight: 32, marginBottom: Spacing.md, color: Colors.text },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 26, marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, paddingVertical: Spacing.base, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  deadlineBar: { padding: 12, paddingHorizontal: 16, backgroundColor: Colors.primaryLight, borderRadius: Radius.sm },
  deadlineExpired: { backgroundColor: '#FEF2F2' },
  deadlineText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  deadlineTextExpired: { color: Colors.error },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: 34, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border },
  ctaBtn: { height: 56, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
  ctaBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
});
