import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import {
  Colors, CATEGORY_COLORS, SCORE_LABELS, SCORE_KEYS, SCORE_ICONS,
  Spacing, FontSize, FontWeight, Radius, Shadow, Typography,
} from '@/constants/theme';

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
        <View style={styles.emptyIcon}>
          <Ionicons name="analytics-outline" size={40} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>아직 평가 데이터가 없습니다</Text>
        <Text style={styles.emptyDesc}>첫 번째 평가를 기다리고 있어요</Text>
      </View>
    );
  }

  const averages = SCORE_KEYS.map((key) => {
    const vals = ratings.map((r) => r[key]).filter((v: any) => typeof v === 'number');
    return vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0;
  });
  const overallAvg = Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10;
  const maxIdx = averages.indexOf(Math.max(...averages));
  const minIdx = averages.indexOf(Math.min(...averages));

  // Feedback vote counts
  const voteCounts = { launch: 0, more: 0, research: 0 };
  ratings.forEach((r) => {
    const vote = r.feedback_vote;
    if (vote && vote in voteCounts) voteCounts[vote as keyof typeof voteCounts]++;
  });
  const totalVotes = voteCounts.launch + voteCounts.more + voteCounts.research;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.headerBadge}>EVALUATION REPORT</Text>
        <Text style={styles.projectName}>{project.title}</Text>
      </View>

      {/* Overall Score Card */}
      <View style={styles.overallCard}>
        <View style={styles.overallTop}>
          <Text style={styles.overallLabel}>종합 점수</Text>
          <View style={styles.participantsBadge}>
            <Ionicons name="people" size={12} color={Colors.white} />
            <Text style={styles.participantsText}>{ratings.length}명 참여</Text>
          </View>
        </View>
        <Text style={styles.overallScore}>{overallAvg}</Text>
        <Text style={styles.overallMax}>/ 5</Text>
      </View>

      {/* Category Scores */}
      <Text style={styles.sectionTitle}>항목별 점수</Text>
      <View style={styles.scoresContainer}>
        {SCORE_LABELS.map((label, idx) => (
          <View key={label} style={styles.scoreRow}>
            <View style={styles.scoreLeft}>
              <View style={[styles.scoreIcon, { backgroundColor: `${CATEGORY_COLORS[idx]}18` }]}>
                <Ionicons name={SCORE_ICONS[idx]} size={16} color={CATEGORY_COLORS[idx]} />
              </View>
              <Text style={styles.scoreLabel}>{label}</Text>
            </View>
            <View style={styles.scoreRight}>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: `${(averages[idx] / 5) * 100}%`,
                  backgroundColor: CATEGORY_COLORS[idx],
                }]} />
              </View>
              <Text style={[styles.scoreValue, { color: CATEGORY_COLORS[idx] }]}>{averages[idx]}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Feedback Poll Results */}
      {totalVotes > 0 && (
        <>
          <Text style={styles.sectionTitle}>판정 투표 결과</Text>
          <View style={styles.voteContainer}>
            {[
              { id: 'launch', label: '출시 강추', color: Colors.success, icon: 'checkmark-circle-outline' as const },
              { id: 'more', label: '보류', color: Colors.warning, icon: 'time-outline' as const },
              { id: 'research', label: '다시 기획', color: Colors.error, icon: 'close-circle-outline' as const },
            ].map((v) => {
              const count = voteCounts[v.id as keyof typeof voteCounts];
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <View key={v.id} style={styles.voteRow}>
                  <View style={styles.voteLeft}>
                    <Ionicons name={v.icon} size={18} color={v.color} />
                    <Text style={styles.voteLabel}>{v.label}</Text>
                  </View>
                  <View style={styles.voteBarBg}>
                    <View style={[styles.voteBarFill, { width: `${pct}%`, backgroundColor: v.color }]} />
                  </View>
                  <Text style={[styles.votePct, { color: v.color }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>평가 통계</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="document-text" size={20} color={Colors.completeness} />
          </View>
          <Text style={styles.statValue}>{ratings.length}</Text>
          <Text style={styles.statLabel}>총 평가 수</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="star" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{overallAvg}</Text>
          <Text style={styles.statLabel}>평균 점수</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="arrow-up-circle" size={20} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{averages[maxIdx]}</Text>
          <Text style={styles.statLabel}>{SCORE_LABELS[maxIdx]}</Text>
          <Text style={styles.statSubLabel}>최고 항목</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="arrow-down-circle" size={20} color={Colors.error} />
          </View>
          <Text style={styles.statValue}>{averages[minIdx]}</Text>
          <Text style={styles.statLabel}>{SCORE_LABELS[minIdx]}</Text>
          <Text style={styles.statSubLabel}>최저 항목</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Empty
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.bgTertiary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.text, marginBottom: Spacing.xs },
  emptyDesc: { fontSize: FontSize.base, color: Colors.textSecondary },

  // Header
  headerSection: { marginBottom: Spacing.xl },
  headerBadge: {
    ...Typography.metaLabel,
    letterSpacing: 4,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  projectName: {
    ...Typography.sectionTitle,
    fontStyle: 'italic',
    color: Colors.text,
  },

  // Overall Score
  overallCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.primary,
    ...Shadow.orange,
  },
  overallTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  overallLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.8)',
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  participantsText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },
  overallScore: { fontSize: 64, fontWeight: FontWeight.black, color: Colors.white, lineHeight: 72 },
  overallMax: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: 'rgba(255,255,255,0.6)', marginTop: -4 },

  // Section
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: FontSize.lg,
    marginBottom: Spacing.base,
  },

  // Score Bars
  scoresContainer: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: 100 },
  scoreIcon: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginLeft: Spacing.sm },
  barBg: { flex: 1, height: 10, backgroundColor: Colors.bgTertiary, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  scoreValue: { fontSize: FontSize.base, fontWeight: FontWeight.black, width: 32, textAlign: 'right' },

  // Vote Results
  voteContainer: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  voteLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  voteBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  voteBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  votePct: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    width: 40,
    textAlign: 'right',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIconBg: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: { fontSize: 22, fontWeight: FontWeight.black, color: Colors.text, fontStyle: 'italic' },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  statSubLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
});
