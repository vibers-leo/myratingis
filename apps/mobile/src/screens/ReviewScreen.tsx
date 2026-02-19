import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, CATEGORY_COLORS, Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';

type QuestionType = 'textarea' | 'short_text' | 'single_choice' | 'multiple_choice' | 'likert';
interface Question {
  id: string; type: QuestionType; text: string; required: boolean;
  options?: string[]; likertScale?: 5 | 7; likertLabels?: [string, string];
}

function normalizeQuestions(raw: any): Question[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((q: any, i: number) => {
    if (typeof q === 'string') return { id: `legacy_${i}`, type: 'textarea' as QuestionType, text: q, required: true };
    return q as Question;
  });
}

const SCORE_LABELS = ['창의성', '실용성', '완성도', '시장성', '디자인'];
const SCORE_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'bulb-outline', 'construct-outline', 'checkmark-circle-outline',
  'trending-up-outline', 'color-palette-outline',
];

interface Props {
  projectId: string;
  onNavigate: (path: string) => void;
  onReplace: (path: string) => void;
}

export default function ReviewScreen({ projectId, onNavigate, onReplace }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([5, 5, 5, 5, 5]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const questions = useMemo(() =>
    normalizeQuestions(project?.custom_data?.audit_config?.questions), [project]);
  const totalSteps = 1 + questions.length;

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId]);

  const fetchProject = async (id: string) => {
    const { data } = await (supabase as any).from('projects').select('*').eq('id', id).single();
    setProject(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !projectId) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from('ProjectRating').insert({
        project_id: projectId, user_id: user.id,
        creativity: scores[0], practicality: scores[1], completeness: scores[2],
        marketability: scores[3], design: scores[4],
        overall: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
        custom_answers: answers, source: 'mobile_app',
      });
      if (error) throw error;
      onReplace(`/report/${projectId}`);
    } catch (e) {
      console.error('Submit failed:', e);
      Alert.alert('제출 실패', '다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={32} color={Colors.textMuted} />
        </View>
        <Text style={styles.lockTitle}>로그인이 필요합니다</Text>
        <Text style={styles.lockDesc}>평가에 참여하려면 먼저 로그인해주세요</Text>
      </View>
    );
  }

  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Step Header */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepProject} numberOfLines={1}>{project?.title}</Text>
        <View style={styles.stepCountBadge}>
          <Text style={styles.stepCount}>{step + 1} / {totalSteps}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {step === 0 ? (
          <View>
            <Text style={styles.stepTitle}>점수 평가</Text>
            <Text style={styles.stepDesc}>각 항목을 1~10점으로 평가해주세요</Text>

            {SCORE_LABELS.map((label, idx) => (
              <View key={label} style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                  <View style={[styles.scoreIconBg, { backgroundColor: `${CATEGORY_COLORS[idx]}18` }]}>
                    <Ionicons name={SCORE_ICONS[idx]} size={18} color={CATEGORY_COLORS[idx]} />
                  </View>
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <View style={[styles.scoreValueBadge, { backgroundColor: `${CATEGORY_COLORS[idx]}18` }]}>
                    <Text style={[styles.scoreValue, { color: CATEGORY_COLORS[idx] }]}>{scores[idx]}</Text>
                  </View>
                </View>
                <Slider
                  minimumValue={1} maximumValue={10} step={1}
                  value={scores[idx]}
                  onValueChange={(val) => { const s = [...scores]; s[idx] = val; setScores(s); }}
                  minimumTrackTintColor={CATEGORY_COLORS[idx]}
                  maximumTrackTintColor={Colors.bgTertiary}
                  thumbTintColor={CATEGORY_COLORS[idx]}
                  style={styles.slider}
                />
              </View>
            ))}
          </View>
        ) : (() => {
          const q = questions[step - 1];
          if (!q) return null;
          return (
            <View>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>Q{step}</Text>
                </View>
                {q.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>필수</Text>
                  </View>
                )}
              </View>
              <Text style={styles.questionTitle}>{q.text}</Text>

              <View style={{ marginTop: Spacing.lg }}>
                {q.type === 'textarea' && (
                  <TextInput value={answers[q.id] || ''} onChangeText={(t) => setAnswers({ ...answers, [q.id]: t })}
                    placeholder="자유롭게 의견을 적어주세요..." placeholderTextColor={Colors.textTertiary}
                    multiline style={styles.textArea} />
                )}
                {q.type === 'short_text' && (
                  <TextInput value={answers[q.id] || ''} onChangeText={(t) => setAnswers({ ...answers, [q.id]: t })}
                    placeholder="답변을 입력하세요" placeholderTextColor={Colors.textTertiary} style={styles.textInput} />
                )}
                {q.type === 'single_choice' && q.options?.map((opt) => (
                  <TouchableOpacity key={opt} onPress={() => setAnswers({ ...answers, [q.id]: opt })}
                    style={[styles.choiceBtn, answers[q.id] === opt && styles.choiceBtnSelected]}>
                    <View style={[styles.choiceRadio, answers[q.id] === opt && styles.choiceRadioSelected]}>
                      {answers[q.id] === opt && <View style={styles.choiceRadioDot} />}
                    </View>
                    <Text style={[styles.choiceText, answers[q.id] === opt && styles.choiceTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
                {q.type === 'multiple_choice' && q.options?.map((opt) => {
                  const sel: string[] = answers[q.id] || [];
                  const on = sel.includes(opt);
                  return (
                    <TouchableOpacity key={opt}
                      onPress={() => setAnswers({ ...answers, [q.id]: on ? sel.filter((s) => s !== opt) : [...sel, opt] })}
                      style={[styles.choiceBtn, on && styles.choiceBtnSelected]}>
                      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? Colors.primary : Colors.textTertiary} />
                      <Text style={[styles.choiceText, on && styles.choiceTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
                {q.type === 'likert' && (
                  <View>
                    <View style={styles.likertLabels}>
                      <Text style={styles.likertLabelText}>{q.likertLabels?.[0] || '매우 불만족'}</Text>
                      <Text style={styles.likertLabelText}>{q.likertLabels?.[1] || '매우 만족'}</Text>
                    </View>
                    <View style={styles.likertRow}>
                      {Array.from({ length: q.likertScale || 5 }, (_, i) => i + 1).map((n) => (
                        <TouchableOpacity key={n} onPress={() => setAnswers({ ...answers, [q.id]: n })}
                          style={[styles.likertBtn, answers[q.id] === n && styles.likertBtnSelected]}>
                          <Text style={[styles.likertBtnText, answers[q.id] === n && styles.likertBtnTextSelected]}>{n}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
            <Text style={styles.prevBtnText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === totalSteps - 1 && styles.nextBtnSubmit]}
          onPress={() => step < totalSteps - 1 ? setStep(step + 1) : handleSubmit()}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {submitting ? '제출 중...' : step === totalSteps - 1 ? '평가 제출' : '다음'}
          </Text>
          {step < totalSteps - 1 && (
            <Ionicons name="chevron-forward" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.bgTertiary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.base,
  },
  lockTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: Spacing.xs },
  lockDesc: { fontSize: FontSize.base, color: Colors.textSecondary },

  // Progress
  progressBg: { height: 3, backgroundColor: Colors.bgTertiary },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },

  // Step Header
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepProject: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.semibold, flex: 1, marginRight: Spacing.sm },
  stepCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  stepCount: { fontSize: FontSize.sm, fontWeight: FontWeight.black, color: Colors.primary },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  // Score Step
  stepTitle: { fontSize: FontSize.title, fontWeight: FontWeight.black, letterSpacing: -0.5, marginBottom: Spacing.xs },
  stepDesc: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.xl },

  scoreCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.base,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scoreIconBg: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  scoreValueBadge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  scoreValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  slider: { width: '100%', height: 40 },

  // Question Step
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  questionNumber: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  questionNumberText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.black },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  requiredText: { fontSize: FontSize.xs, color: Colors.error, fontWeight: FontWeight.bold },
  questionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, lineHeight: 26 },

  // Input Types
  textArea: {
    minHeight: 140,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
    color: Colors.text,
    backgroundColor: Colors.bgSecondary,
  },
  textInput: {
    height: 52,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.bgSecondary,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  choiceBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  choiceRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  choiceRadioSelected: { borderColor: Colors.primary },
  choiceRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  choiceText: { fontSize: 15, fontWeight: FontWeight.semibold, color: Colors.text },
  choiceTextSelected: { color: Colors.primary },

  // Likert
  likertLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  likertLabelText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  likertRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  likertBtn: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  likertBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  likertBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text },
  likertBtnTextSelected: { color: Colors.white },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  prevBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  prevBtnText: { fontSize: 15, fontWeight: FontWeight.bold, color: Colors.text },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.text,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  nextBtnSubmit: { backgroundColor: Colors.primary, ...Shadow.orange },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: FontWeight.extrabold },
});
