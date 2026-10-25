'use client';

import Link from 'next/link';
import { Check, Flame, Play, Zap } from 'lucide-react';
import { levelFromXp, localDayKey } from '@/lib/quiz';
import { useI18n } from '@/lib/i18n';
import { useAppStore, useHydrated } from '@/lib/store';
import { formatNumber } from '@/lib/utils';

/** Circular XP progress with the level in the middle. */
function LevelRing({ level, percent }: { level: number; percent: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgb(var(--md-outline-variant) / 0.5)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgb(var(--brand-b))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, percent)))}
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease-emphasized-decelerate)' }}
        />
      </svg>
      <span className="tnum absolute text-title-medium font-bold text-on-surface">{level}</span>
    </span>
  );
}

/**
 * Home daily-challenge card (v4.1): today's status, answer streak and the
 * XP level ring — one tap into /practice.
 */
export function DailyChallengeCard() {
  const { t, lang } = useI18n();
  const hydrated = useHydrated();
  const practice = useAppStore((state) => state.practice);

  if (!hydrated) return <div className="skeleton h-24 rounded-3xl" aria-hidden="true" />;

  const done = practice.dailyDoneDay === localDayKey();
  const { level, intoLevel, levelSpan } = levelFromXp(practice.xp);
  const percent = levelSpan > 0 ? intoLevel / levelSpan : 0;

  return (
    <section aria-label={t('dailyChallenge')} className="gradient-border-soft rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <LevelRing level={level} percent={percent} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-title-medium font-bold text-on-surface">
            {t('dailyChallenge')}
            {done && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success-container px-2 py-0.5 text-label-small font-semibold text-on-success-container">
                <Check className="h-3 w-3" aria-hidden="true" />
                {t('markedDone')}
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-body-small text-on-surface-variant">
            {done ? t('dailyDone') : t('dailyChallengeHint')}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label-small text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
              {t('currentStreak')}:
              <span className="tnum font-semibold text-on-surface">
                {formatNumber(practice.streak, { decimals: 0, lang })}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t('totalXp')}:
              <span className="tnum font-semibold text-on-surface">
                {formatNumber(practice.xp, { decimals: 0, lang })}
              </span>
            </span>
            <span>{t('levelLabel', { level: formatNumber(level, { decimals: 0, lang }) })}</span>
          </div>
        </div>
        <Link
          href="/practice/"
          className="shine inline-flex min-h-touch shrink-0 items-center gap-1 rounded-full brand-gradient px-3.5 text-label-large font-semibold text-white shadow-glow"
        >
          <Play className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          <span className="hidden min-[400px]:inline">{done ? t('freePractice') : t('startChallenge')}</span>
          <span className="min-[400px]:hidden">{done ? t('freePractice') : t('startPractice')}</span>
        </Link>
      </div>
    </section>
  );
}
