import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';

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
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
        <Text style={{ fontWeight: FontWeight.bold }}>로그인이 필요합니다</Text>
      </View>
    );
  }

  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.stepHeader}>
        <Text style={styles.stepProject}>{project?.title}</Text>
        <Text style={styles.stepCount}>{step + 1} / {totalSteps}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {step === 0 ? (
          <View>
            <Text style={styles.stepTitle}>점수 평가</Text>
            <Text style={styles.stepDesc}>각 항목을 1~10점으로 평가해주세요</Text>
            {SCORE_LABELS.map((label, idx) => (
              <View key={label} style={styles.scoreItem}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <Text style={styles.scoreValue}>{scores[idx]}</Text>
                </View>
                <Slider
                  minimumValue={1} maximumValue={10} step={1}
                  value={scores[idx]}
                  onValueChange={(val) => { const s = [...scores]; s[idx] = val; setScores(s); }}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.bgTertiary}
                  thumbTintColor={Colors.primary}
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
              <Text style={styles.questionTitle}>Q{step}. {q.text}</Text>
              {q.required && <Text style={styles.requiredTag}>필수</Text>}
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
                      <Text style={[styles.choiceText, on && styles.choiceTextSelected]}>{on ? '✅ ' : ''}{opt}</Text>
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

      <View style={styles.bottomBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.prevBtnText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === totalSteps - 1 && { backgroundColor: Colors.primary }]}
          onPress={() => step < totalSteps - 1 ? setStep(step + 1) : handleSubmit()}
          disabled={submitting}
        >
          <Text style={styles.nextBtnText}>
            {submitting ? '제출 중...' : step === totalSteps - 1 ? '평가 제출' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressBg: { height: 3, backgroundColor: Colors.bgSecondary },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  stepHeader: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  stepProject: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  stepCount: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.primary },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  stepTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, marginBottom: Spacing.sm },
  stepDesc: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  scoreItem: { marginBottom: Spacing.xl },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  scoreLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  scoreValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.primary },
  slider: { width: '100%', height: 40 },
  questionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 6 },
  requiredTag: { fontSize: FontSize.xs, color: Colors.error, fontWeight: FontWeight.bold },
  textArea: { minHeight: 140, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, fontSize: 15, lineHeight: 24, textAlignVertical: 'top', color: Colors.text },
  textInput: { height: 48, paddingHorizontal: Spacing.base, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, fontSize: 15, color: Colors.text },
  choiceBtn: { padding: 14, paddingHorizontal: Spacing.base, marginBottom: Spacing.sm, borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white },
  choiceBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  choiceText: { fontSize: 15, fontWeight: FontWeight.semibold, color: Colors.text },
  choiceTextSelected: { color: Colors.primary },
  likertLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  likertLabelText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  likertRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  likertBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  likertBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  likertBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text },
  likertBtnTextSelected: { color: Colors.white },
  bottomBar: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: 34, borderTopWidth: 1, borderTopColor: Colors.border },
  prevBtn: { height: 52, paddingHorizontal: 20, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  prevBtnText: { fontSize: 15, fontWeight: FontWeight.bold },
  nextBtn: { flex: 1, height: 52, borderRadius: Radius.lg, backgroundColor: Colors.text, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: FontWeight.extrabold },
});
