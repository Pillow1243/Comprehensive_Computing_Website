'use client';

import { useState } from 'react';
import { Check, Dumbbell, Flame, Play, Sparkles, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useI18n } from '@/lib/i18n';
import {
  dailyChallenge,
  generateQuiz,
  levelFromXp,
  localDayKey,
  xpReward,
  type QuizDifficulty,
  type QuizQuestion,
} from '@/lib/quiz';
import { useAppStore, useHydrated } from '@/lib/store';
import { formatNumber, cn, haptic } from '@/lib/utils';

type Mode = 'menu' | 'daily' | 'free';

export default function PracticePage() {
  const { t, lang, numerals } = useI18n();
  const hydrated = useHydrated();
  const practice = useAppStore((state) => state.practice);
  const recordAnswer = useAppStore((state) => state.recordPracticeAnswer);
  const markDailyDone = useAppStore((state) => state.markDailyDone);
  const hapticsEnabled = useAppStore((state) => state.settings.haptics);

  const [mode, setMode] = useState<Mode>('menu');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState(0);
  const [roundXp, setRoundXp] = useState(0);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(2);
  const [finished, setFinished] = useState(false);

  const today = localDayKey();
  const dailyDone = hydrated && practice.dailyDoneDay === today;
  const { level, intoLevel, levelSpan } = levelFromXp(practice.xp);
  const accuracy = practice.answered > 0 ? Math.round((practice.correct / practice.answered) * 100) : 0;
  const fmt = (value: number) => formatNumber(value, { decimals: 0, lang, numerals });

  const start = (nextMode: 'daily' | 'free') => {
    const list =
      nextMode === 'daily'
        ? dailyChallenge(today)
        : generateQuiz(10, `free:${Date.now()}:${practice.answered}`, difficulty);
    setQuestions(list);
    setIndex(0);
    setPicked(null);
    setRoundScore(0);
    setRoundXp(0);
    setFinished(false);
    setMode(nextMode);
  };

  const current = questions[index];

  const choose = (choiceIndex: number) => {
    if (picked !== null || !current) return;
    const correct = choiceIndex === current.answerIndex;
    const xp = xpReward(current.difficulty, practice.streak);
    setPicked(choiceIndex);
    haptic(correct ? 16 : [10, 40, 10], hapticsEnabled);
    recordAnswer(correct, xp, today);
    if (correct) {
      setRoundScore((value) => value + 1);
      setRoundXp((value) => value + xp);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      if (mode === 'daily') markDailyDone(today);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  const questionText = (question: QuizQuestion) => (lang === 'en' ? question.promptEn : question.promptFa);
  const explanationText = (question: QuizQuestion) =>
    lang === 'en' ? question.explanationEn : question.explanationFa;

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="hero-surface p-5">
        <p className="data-pill relative z-10">
          <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
          {t('tools')}
        </p>
        <h1 className="relative z-10 mt-2 text-headline-medium font-bold text-on-surface">{t('practiceTitle')}</h1>
        <p className="relative z-10 mt-1 text-body-medium text-on-surface-variant">{t('practiceHint')}</p>
        <div className="relative z-10 mt-4 flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
            <span className="text-title-large font-black leading-none">{fmt(level)}</span>
            <span className="text-[10px] font-semibold">{t('yourLevel')}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label-large font-semibold text-on-surface">
              {t('totalXp')}: <span className="mono-result">{fmt(practice.xp)}</span>
            </p>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-container-lowest" role="progressbar" aria-valuenow={intoLevel} aria-valuemax={levelSpan}>
              <div
                className="brand-gradient h-full rounded-full transition-all"
                style={{ width: `${levelSpan ? Math.min(100, (intoLevel / levelSpan) * 100) : 0}%` }}
              />
            </div>
            <p className="mt-1 text-label-small text-on-surface-variant">
              {fmt(intoLevel)} / {fmt(levelSpan)} XP
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
          <span className="data-pill"><Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" /> {t('currentStreak')}: {fmt(practice.streak)}</span>
          <span className="data-pill"><Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> {t('bestStreak')}: {fmt(practice.bestStreak)}</span>
          <span className="data-pill">{t('accuracy')}: {fmt(accuracy)}٪</span>
          <span className="data-pill">{t('questionsAnswered')}: {fmt(practice.answered)}</span>
        </div>
      </header>

      {mode === 'menu' || finished ? (
        <section className="space-y-3">
          {finished && (
            <div className="hero-surface p-5 text-center" aria-live="polite">
              <p className="relative z-10 text-headline-small font-bold text-on-surface">{t('quizSummary')}</p>
              <p className="mono-result relative z-10 mt-1 text-headline-large font-black text-on-surface">
                {fmt(roundScore)} / {fmt(questions.length)}
              </p>
              <p className="relative z-10 text-body-medium text-success">{t('xpEarned', { xp: roundXp })}</p>
            </div>
          )}
          <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
            <h2 className="flex items-center gap-2 text-title-medium font-semibold text-on-surface">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              {t('dailyChallenge')}
            </h2>
            <p className="mt-1 text-body-small text-on-surface-variant">{t('dailyChallengeHint')}</p>
            {dailyDone && mode === 'menu' ? (
              <p className="mt-3 text-label-large font-semibold text-success">{t('dailyDone')}</p>
            ) : (
              <Button className="mt-3" onClick={() => start('daily')}>
                <Play className="h-4.5 w-4.5 rtl:-scale-x-100" aria-hidden="true" />
                {t('startPractice')}
              </Button>
            )}
          </div>
          <div className="rounded-3xl border border-outline-variant bg-surface-container p-4">
            <h2 className="text-title-medium font-semibold text-on-surface">{t('freePractice')}</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {([1, 2, 3] as QuizDifficulty[]).map((levelValue) => (
                <Chip key={levelValue} selected={difficulty === levelValue} onClick={() => setDifficulty(levelValue)}>
                  {t(levelValue === 1 ? 'basic' : levelValue === 2 ? 'intermediate' : 'advanced')}
                </Chip>
              ))}
            </div>
            <Button className="mt-3" variant="tonal" onClick={() => start('free')}>
              <Play className="h-4.5 w-4.5 rtl:-scale-x-100" aria-hidden="true" />
              {finished ? t('playAgain') : t('startPractice')}
            </Button>
          </div>
        </section>
      ) : current ? (
        <section className="space-y-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <span className="text-label-large text-on-surface-variant">
              {t('questionOf', { current: index + 1, total: questions.length })}
            </span>
            <span className="data-pill">{lang === 'en' ? current.topicEn : current.topicFa}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-valuenow={index + 1} aria-valuemax={questions.length}>
            <div className="brand-gradient h-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <article className="hero-surface p-5">
            <h2 className="relative z-10 text-title-large font-semibold leading-relaxed text-on-surface">
              {questionText(current)}
            </h2>
          </article>
          <div className="grid gap-2 sm:grid-cols-2">
            {current.choices.map((choice, choiceIndex) => {
              const isAnswer = choiceIndex === current.answerIndex;
              const isPicked = picked === choiceIndex;
              return (
                <button
                  key={`${choice}-${choiceIndex}`}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => choose(choiceIndex)}
                  className={cn(
                    'card-lift flex min-h-14 items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-start transition-colors',
                    picked === null && 'border-outline-variant bg-surface-container',
                    picked !== null && isAnswer && 'border-success bg-success/15 text-on-surface',
                    picked !== null && isPicked && !isAnswer && 'border-error bg-error/10 text-on-surface',
                    picked !== null && !isPicked && !isAnswer && 'border-outline-variant bg-surface-container opacity-60',
                  )}
                >
                  <span className="mono-result text-headline-small font-bold">
                    {fmt(choice)}
                    {current.unitFa ? (
                      <span className="ms-1 text-label-medium font-medium text-on-surface-variant">
                        {lang === 'en' ? current.unitEn : current.unitFa}
                      </span>
                    ) : null}
                  </span>
                  {picked !== null && isAnswer && <Check className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />}
                  {picked !== null && isPicked && !isAnswer && <X className="h-5 w-5 shrink-0 text-error" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className={cn('rounded-3xl border p-4', picked === current.answerIndex ? 'border-success/50 bg-success/10' : 'border-error/40 bg-error/5')}>
              <p className={cn('text-title-small font-bold', picked === current.answerIndex ? 'text-success' : 'text-error')}>
                {picked === current.answerIndex ? t('correctAnswer') : t('wrongAnswer')}
                {picked === current.answerIndex && (
                  <span className="ms-2 text-label-large">{t('xpEarned', { xp: xpReward(current.difficulty, Math.max(0, practice.streak - 1)) })}</span>
                )}
              </p>
              <p className="mt-1 text-body-medium leading-relaxed text-on-surface">
                <span className="font-semibold">{t('explanation')}: </span>
                {explanationText(current)}
              </p>
              <Button className="mt-3" onClick={next}>
                {index + 1 >= questions.length ? t('quizSummary') : t('nextQuestion')}
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
