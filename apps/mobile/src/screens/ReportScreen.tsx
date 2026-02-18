import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

const SCORE_LABELS = ['창의성', '실용성', '완성도', '시장성', '디자인'];
const SCORE_KEYS = ['creativity', 'practicality', 'completeness', 'marketability', 'design'];

interface Props { id: string; }

export default function ReportScreen({ id }: Props) {
  const [project, setProject] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchData(id); }, [id]);

  const fetchData = async (projectId: string) => {
    try {
      const [projectRes, ratingsRes] = await Promise.all([
        (supabase as any).from('projects').select('*').eq('id', projectId).single(),
        (supabase as any).from('ProjectRating').select('*').eq('project_id', projectId),
      ]);
      setProject(projectRes.data);
      setRatings(ratingsRes.data || []);
    } catch (e) { console.error('Failed to fetch report:', e); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!project || ratings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
        <Text style={{ fontWeight: FontWeight.bold, color: Colors.textSecondary }}>아직 평가 데이터가 없습니다</Text>
      </View>
    );
  }

  const averages = SCORE_KEYS.map((key) => {
    const vals = ratings.map((r) => r[key]).filter((v: any) => typeof v === 'number');
    return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0;
  });
  const overallAvg = Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>평가 리포트</Text>
      <Text style={styles.projectName}>{project.title}</Text>

      <View style={styles.overallCard}>
        <Text style={styles.overallLabel}>종합 점수</Text>
        <Text style={styles.overallScore}>{overallAvg}</Text>
        <Text style={styles.overallParticipants}>{ratings.length}명 참여</Text>
      </View>

      <Text style={styles.sectionTitle}>항목별 점수</Text>
      {SCORE_LABELS.map((label, idx) => (
        <View key={label} style={styles.barItem}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>{label}</Text>
            <Text style={styles.barValue}>{averages[idx]}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${(averages[idx] / 10) * 100}%` }]} />
          </View>
        </View>
      ))}

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>평가 통계</Text>
        <View style={styles.statsGrid}>
          {[
            { value: ratings.length, label: '총 평가 수' },
            { value: overallAvg, label: '평균 점수' },
            { value: Math.max(...averages).toFixed(1), label: '최고 항목' },
            { value: Math.min(...averages).toFixed(1), label: '최저 항목' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: FontWeight.black, letterSpacing: -0.5, marginBottom: 4 },
  projectName: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.semibold, marginBottom: Spacing.xl },
  overallCard: { borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl, backgroundColor: Colors.primary },
  overallLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  overallScore: { fontSize: 48, fontWeight: FontWeight.black, color: Colors.white, lineHeight: 56 },
  overallParticipants: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, marginBottom: Spacing.base },
  barItem: { marginBottom: Spacing.base },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  barValue: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.primary },
  barBg: { height: 8, backgroundColor: Colors.bgSecondary, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  statsSection: { marginTop: Spacing.xl, backgroundColor: Colors.bgSecondary, borderRadius: Radius.lg, padding: Spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { width: '47%', backgroundColor: Colors.white, borderRadius: Radius.sm, padding: Spacing.base, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
